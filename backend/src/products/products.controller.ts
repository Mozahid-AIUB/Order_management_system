import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @Get()
    findAll(@Query('enabled') enabled?: string) {
        return this.productsService.findAll(enabled === 'true');
    }

    @Post()
    create(@Body() body: { name: string; description?: string; price: number; weight: number }) {
        return this.productsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.productsService.update(id, body);
    }
}
