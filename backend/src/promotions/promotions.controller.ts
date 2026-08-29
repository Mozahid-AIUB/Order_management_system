import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionsController {
    constructor(private promotionsService: PromotionsService) { }

    @Get()
    findAll() {
        return this.promotionsService.findAll();
    }

    @Post()
    create(@Body() body: any) {
        return this.promotionsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.promotionsService.update(id, body);
    }
}
