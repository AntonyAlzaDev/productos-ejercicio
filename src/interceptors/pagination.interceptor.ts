import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { totalmem } from "os";
import { first, map, Observable } from "rxjs";


@Injectable()
export class PaginationInterceptor implements NestInterceptor{

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

        const request = context.switchToHttp().getRequest();

        const page = parseInt(request.query.page) || 1;
        const limit = Math.min(parseInt(request.query.limit) || 10 , 100)

        return next.handle().pipe(
            map((responseToClient) =>{
                if(Array.isArray(responseToClient)){
                    return this.paginateArray(responseToClient, page, limit, request.path)
                }

                if(responseToClient && typeof responseToClient == 'object' && Array.isArray(responseToClient.data) ){
                    const paginatedData = this.paginateArray(responseToClient.data, page, limit, request.path) 
                    return {
                        ...responseToClient,
                        ... paginatedData
                    }
                }

                return responseToClient;
            })
        );
        
    }


    private paginateArray(item: any[], page: number, limit: number, path: string){

        const satrtIndex = (page - 1) * limit;
        const endIndex = satrtIndex + limit;

        const paginatedItems = item.slice(satrtIndex,endIndex);

        const totalItems = item.length;
        const totalPages = Math.ceil(totalItems/limit)
        const hasNextPage = page < totalPages
        const hasPreviousPage = page > 1;

        const baseUrl = `${path}`;

        return{
            data: paginatedItems,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems,
                totalPages,
                hasNextPage,
                hasPreviousPage,

                nextPage: hasNextPage? `${baseUrl}?page=${page + 1}&limit=${limit}`: null,
                previousPage: hasPreviousPage? `${baseUrl}?page=${page - 1}&limit=${limit}`: null,
                firstPage: `${baseUrl}?page=1&limit=${limit}`,
                lastPage: `${baseUrl}?page=${totalPages}&limit=${limit}`
            }
        }

        
    }
}