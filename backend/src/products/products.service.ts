import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    findAll(onlyEnabled?: boolean) {
        return this.prisma.product.findMany({
            where: onlyEnabled ? { isEnabled: true } : undefined,
        });
    }

    create(data: {
        name: string;
        description?: string;
        price: number;
        weight: number;
    }) {
        return this.prisma.product.create({ data });
    }

    update(id: string, data: Partial<{
        name: string;
        description: string;
        price: number;
        weight: number;
        isEnabled: boolean;
    }>) {
        return this.prisma.product.update({ where: { id }, data });
    }
}
