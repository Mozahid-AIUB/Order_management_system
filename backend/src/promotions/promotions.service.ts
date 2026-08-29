import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionsService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.promotion.findMany({ include: { slabs: true } });
    }

    create(data: {
        title: string;
        type: 'PERCENTAGE' | 'FIXED' | 'WEIGHTED';
        startDate: string;
        endDate: string;
        productId: string;
        percentageValue?: number;
        fixedValue?: number;
        slabs?: { minWeight: number; maxWeight?: number; discountPerUnit: number }[];
    }) {
        return this.prisma.promotion.create({
            data: {
                title: data.title,
                type: data.type,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                productId: data.productId,
                percentageValue: data.percentageValue,
                fixedValue: data.fixedValue,
                slabs: data.slabs ? { create: data.slabs } : undefined,
            },
            include: { slabs: true },
        });
    }

    update(id: string, data: Partial<{ title: string; startDate: string; endDate: string; isEnabled: boolean }>) {
        return this.prisma.promotion.update({
            where: { id },
            data: {
                title: data.title,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                isEnabled: data.isEnabled,
            },
        });
    }
}
