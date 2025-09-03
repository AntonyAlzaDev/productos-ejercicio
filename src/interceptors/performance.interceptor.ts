import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";


@Injectable()
export class PerformanceInterceptor implements NestInterceptor{

    private readonly logger = new Logger(PerformanceInterceptor.name);

    // REDIS
    private static metrics = new Map<string, {
        totalRequests: number;
        totalTime: number;
        averageTime: number;
        slowesTime: number;
        fastestTime: number;
    }>();

    intercept(context: ExecutionContext, next: CallHandler): Observable<any>{

        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const path = request.route?.path || request.path;
        const endpointKey = `${method} ${path}`

        const startTime = Date.now();

        this.logger.log(` [${endpointKey}] Request started`);

        return next.handle().pipe(

            tap((response) =>{
                const endTime = Date.now();
                const duration = endTime - startTime;

                this.updateMetrics(endpointKey, duration);

                this.logger.log(` [${endpointKey}] Completed in ${duration} ms`);

                const httpResponse = context.switchToHttp().getResponse();
                httpResponse.setHeader('X-Response-Time', `${duration}ms`)
            }),
            catchError((error) =>{
                const endTime = Date.now();
                const duration = endTime - startTime;

                this.updateMetrics(endpointKey, duration);

                this.logger.log(` [${endpointKey}] Failed after ${duration} ms : ${error}`);

                throw error;

            })
        );
        
    }

    private updateMetrics(endpointKey: string, duration: number ){

        const existing = PerformanceInterceptor.metrics.get(endpointKey) || {
            totalRequests: 0,
            totalTime: 0,
            averageTime: 0,
            slowesTime: 0,
            fastestTime: Infinity
        }


        existing.totalRequests++;
        existing.totalTime += duration;
        existing.averageTime = existing.totalTime / existing.totalRequests;
        existing.slowesTime = Math.max(existing.slowesTime, duration);
        existing.fastestTime = Math.min(Infinity, duration);

        PerformanceInterceptor.metrics.set(endpointKey,existing);
    }
  
    static getMetrics(): Record<string, any>{
        const result = {};

        for(const[endpoint, metrics] of PerformanceInterceptor.metrics.entries()){
            result[endpoint] = {
                ...metrics,
                fastestTime: metrics.fastestTime === Infinity ? 0 : metrics.fastestTime
            }
        }

        return result;
    }

}