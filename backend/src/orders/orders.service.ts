import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async findActivePromotion(productId: string) {
        const now = new Date();
        return this.prisma.promotion.findFirst({
            where: {
                productId,
                isEnabled: true,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            include: { slabs: true },
        });
    }

    calculateDiscount(promotion: any, price: number, weight: number, quantity: number): number {
        if (promotion.type === 'PERCENTAGE') {
            const lineTotal = price * quantity;
            return lineTotal * (Number(promotion.percentageValue) / 100);
        }

        if (promotion.type === 'FIXED') {
            return Number(promotion.fixedValue) * quantity;
        }

        if (promotion.type === 'WEIGHTED') {
            const totalWeight = weight * quantity;
            const slab = promotion.slabs.find(
                (s: any) =>
                    totalWeight >= s.minWeight &&
                    (s.maxWeight === null || totalWeight <= s.maxWeight),
            );
            if (!slab) return 0;
            return Number(slab.discountPerUnit) * quantity;
        }

        return 0;
    }
    async create(data: {
        customerName: string;
        customerPhone: string;
        items: { productId: string; quantity: number }[];
    }) {
        const productIds = data.items.map((item) => item.productId);
        const now = new Date();

        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        const promotions = await this.prisma.promotion.findMany({
            where: {
                productId: { in: productIds },
                isEnabled: true,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            include: { slabs: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p] as const));
        const promotionMap = new Map(promotions.map((p) => [p.productId, p] as const));

        let subtotal = 0;
        let totalDiscount = 0;
        const orderItems: any[] = [];

        for (const item of data.items) {
            const product = productMap.get(item.productId);
            if (!product) continue;

            const price = Number(product.price);
            const lineAmount = price * item.quantity;

            const promotion = promotionMap.get(item.productId);
            const discount = promotion
                ? this.calculateDiscount(promotion, price, product.weight, item.quantity)
                : 0;

            subtotal += lineAmount;
            totalDiscount += discount;

            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: price,
                discountApplied: discount,
                lineTotal: lineAmount - discount,
            });
        }

        return this.prisma.order.create({
            data: {
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                subtotal,
                totalDiscount,
                grandTotal: subtotal - totalDiscount,
                items: { create: orderItems },
            },
            include: { items: true },
        });
    }

    findAll() {
        return this.prisma.order.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }


}
