import { Body, Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { PaginationInterceptor } from 'src/interceptors/pagination.interceptor';
import { PerformanceInterceptor } from 'src/interceptors/performance.interceptor';

@Controller('products')
@UseInterceptors(PerformanceInterceptor,PaginationInterceptor)
export class ProductsController {

    private products = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: Math.round(Math.random() * 1000),
        category: ['Electronics', 'Books', 'Clothing', 'Home'][Math.floor(Math.random() * 4)],
        inStock: Math.random() > 0.2, // 80% probabilidad de estar en stock
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));


    @Get()
    findAll(){
        const start = Date.now();
        while (Date.now() - start < 50){}

        return this.products;
    }

    @Get('search')
    search(@Query('q') query: string){

        const start = Date.now();
        while (Date.now() - start < 200){}

        if(!query){
            return [];
        }

        const results = this.products.filter(products =>
            products.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
            products.category.toLocaleLowerCase().includes(query.toLocaleLowerCase())
        );

        return results;
    }

    @Get('expensive')
    getExpensiveProducts(){

        const start = Date.now();
        while (Date.now() - start < 500){}

        return this.products
        .filter(product => product.price > 500)
        .sort((a,b) => b.price - a.price);
    }

    @Post()
    create(@Body() createProductDTO: any){
        const newProduct = {
            id: this.products.length + 1,
            ...createProductDTO,
            createdAt: new Date().toISOString()
        };

        this.products.push(newProduct);

        return {
            success: true,
            message: 'Product created successfully',
            product: newProduct
        }
    }

    @Get('metrics')
    getMetrics(){
        return {
            performanceMetrics : PerformanceInterceptor.getMetrics()
        }
    }


}
