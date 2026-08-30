/**
 * Fills an empty database with a wholesale grocery catalogue so the app has
 * something to show. Safe to skip if products already exist.
 *
 *   npx ts-node prisma/demo-seed.ts
 */
import { PrismaClient, PromotionType } from '@prisma/client';

const prisma = new PrismaClient();

type Seed = { name: string; description: string; price: number; weight: number };

const CATALOGUE: Seed[] = [
    // Rice & Grains
    { name: 'Miniket Rice 5kg', description: 'Rice & Grains - polished, fine grain', price: 420, weight: 5000 },
    { name: 'Nazirshail Rice 5kg', description: 'Rice & Grains - aromatic everyday rice', price: 465, weight: 5000 },
    { name: 'Chinigura Rice 1kg', description: 'Rice & Grains - polao rice', price: 165, weight: 1000 },
    { name: 'Atap Rice 5kg', description: 'Rice & Grains - sunned rice', price: 390, weight: 5000 },
    { name: 'Red Rice 2kg', description: 'Rice & Grains - unpolished, high fibre', price: 210, weight: 2000 },
    { name: 'Wheat Flour 2kg', description: 'Rice & Grains - atta, whole wheat', price: 130, weight: 2000 },
    { name: 'Maida Flour 1kg', description: 'Rice & Grains - refined flour', price: 75, weight: 1000 },
    { name: 'Semolina 500g', description: 'Rice & Grains - suji', price: 55, weight: 500 },
    { name: 'Flattened Rice 500g', description: 'Rice & Grains - chira', price: 48, weight: 500 },
    { name: 'Puffed Rice 500g', description: 'Rice & Grains - muri', price: 42, weight: 500 },

    // Pulses
    { name: 'Red Lentil 1kg', description: 'Pulses - masoor dal', price: 185, weight: 1000 },
    { name: 'Chickpea 1kg', description: 'Pulses - chola boot', price: 140, weight: 1000 },
    { name: 'Mung Bean 1kg', description: 'Pulses - moog dal', price: 175, weight: 1000 },
    { name: 'Black Gram 1kg', description: 'Pulses - mashkalai dal', price: 165, weight: 1000 },
    { name: 'Split Pea 1kg', description: 'Pulses - anchor dal', price: 95, weight: 1000 },
    { name: 'Pigeon Pea 500g', description: 'Pulses - arhor dal', price: 105, weight: 500 },
    { name: 'Kidney Bean 500g', description: 'Pulses - rajma', price: 130, weight: 500 },

    // Oil & Ghee
    { name: 'Soybean Oil 5L', description: 'Oil & Ghee - refined bottle', price: 840, weight: 5000 },
    { name: 'Soybean Oil 2L', description: 'Oil & Ghee - refined bottle', price: 345, weight: 2000 },
    { name: 'Mustard Oil 1L', description: 'Oil & Ghee - cold pressed', price: 280, weight: 1000 },
    { name: 'Sunflower Oil 1L', description: 'Oil & Ghee - refined', price: 240, weight: 1000 },
    { name: 'Rice Bran Oil 1L', description: 'Oil & Ghee - heart friendly', price: 265, weight: 1000 },
    { name: 'Pure Ghee 500g', description: 'Oil & Ghee - clarified butter', price: 720, weight: 500 },
    { name: 'Olive Oil 500ml', description: 'Oil & Ghee - extra virgin', price: 890, weight: 500 },

    // Spices
    { name: 'Turmeric Powder 200g', description: 'Spices - holud guro', price: 65, weight: 200 },
    { name: 'Chilli Powder 200g', description: 'Spices - morich guro', price: 95, weight: 200 },
    { name: 'Coriander Powder 200g', description: 'Spices - dhone guro', price: 70, weight: 200 },
    { name: 'Cumin Powder 100g', description: 'Spices - jeera guro', price: 110, weight: 100 },
    { name: 'Garam Masala 50g', description: 'Spices - blended', price: 85, weight: 50 },
    { name: 'Whole Cumin 100g', description: 'Spices - jeera', price: 95, weight: 100 },
    { name: 'Bay Leaf 50g', description: 'Spices - tej pata', price: 40, weight: 50 },
    { name: 'Cinnamon Stick 100g', description: 'Spices - daruchini', price: 180, weight: 100 },
    { name: 'Cardamom 50g', description: 'Spices - elachi', price: 320, weight: 50 },
    { name: 'Clove 50g', description: 'Spices - lobongo', price: 150, weight: 50 },
    { name: 'Black Pepper 100g', description: 'Spices - gol morich', price: 175, weight: 100 },
    { name: 'Ginger Paste 200g', description: 'Spices - ready to cook', price: 75, weight: 200 },

    // Sugar & Salt
    { name: 'Refined Sugar 5kg', description: 'Sugar & Salt - white sugar', price: 690, weight: 5000 },
    { name: 'Refined Sugar 1kg', description: 'Sugar & Salt - white sugar', price: 140, weight: 1000 },
    { name: 'Brown Sugar 1kg', description: 'Sugar & Salt - unrefined', price: 165, weight: 1000 },
    { name: 'Iodised Salt 1kg', description: 'Sugar & Salt - table salt', price: 38, weight: 1000 },
    { name: 'Rock Salt 500g', description: 'Sugar & Salt - bit lobon', price: 60, weight: 500 },
    { name: 'Date Molasses 500g', description: 'Sugar & Salt - khejur gur', price: 240, weight: 500 },
    { name: 'Honey 500g', description: 'Sugar & Salt - natural', price: 520, weight: 500 },

    // Beverages
    { name: 'Tea Leaves 1kg', description: 'Beverages - loose black tea', price: 680, weight: 1000 },
    { name: 'Green Tea 200g', description: 'Beverages - loose leaf', price: 290, weight: 200 },
    { name: 'Tea Bags 100pc', description: 'Beverages - 200g box', price: 240, weight: 200 },
    { name: 'Instant Coffee 100g', description: 'Beverages - freeze dried', price: 480, weight: 100 },
    { name: 'Coffee Beans 250g', description: 'Beverages - medium roast', price: 620, weight: 250 },

    // Dairy
    { name: 'Full Cream Milk Powder 1kg', description: 'Dairy - instant powder', price: 980, weight: 1000 },
    { name: 'Milk Powder 500g', description: 'Dairy - instant powder', price: 500, weight: 500 },
    { name: 'Skimmed Milk Powder 500g', description: 'Dairy - low fat', price: 520, weight: 500 },
    { name: 'Condensed Milk 400g', description: 'Dairy - sweetened', price: 145, weight: 400 },
    { name: 'Butter 200g', description: 'Dairy - salted', price: 310, weight: 200 },
    { name: 'Cheese Slice 200g', description: 'Dairy - processed, 10 slices', price: 280, weight: 200 },

    // Snacks
    { name: 'Digestive Biscuit 350g', description: 'Snacks - wheat biscuit', price: 120, weight: 350 },
    { name: 'Cream Biscuit 300g', description: 'Snacks - chocolate cream', price: 85, weight: 300 },
    { name: 'Salted Cracker 200g', description: 'Snacks - toast biscuit', price: 55, weight: 200 },
    { name: 'Potato Chips 150g', description: 'Snacks - salted', price: 90, weight: 150 },
    { name: 'Mixed Nuts 250g', description: 'Snacks - roasted', price: 420, weight: 250 },
    { name: 'Peanut 500g', description: 'Snacks - roasted, salted', price: 180, weight: 500 },
    { name: 'Instant Noodles 8pc', description: 'Snacks - masala, 8 packs', price: 160, weight: 480 },

    // Household
    { name: 'Detergent Powder 2kg', description: 'Household - washing powder', price: 480, weight: 2000 },
    { name: 'Dishwashing Liquid 500ml', description: 'Household - lemon', price: 145, weight: 500 },
    { name: 'Toilet Cleaner 500ml', description: 'Household - disinfectant', price: 165, weight: 500 },
    { name: 'Floor Cleaner 1L', description: 'Household - antiseptic', price: 210, weight: 1000 },
    { name: 'Bath Soap 4pc', description: 'Household - 100g x 4', price: 220, weight: 400 },
    { name: 'Shampoo 400ml', description: 'Household - anti dandruff', price: 380, weight: 400 },
    { name: 'Toothpaste 200g', description: 'Household - fluoride', price: 165, weight: 200 },
];

/** A couple of items start hidden so the disabled state is visible. */
const HIDDEN = ['Puffed Rice 500g', 'Coffee Beans 250g'];

const YEAR_START = new Date(new Date().getFullYear(), 0, 1);
const YEAR_END = new Date(new Date().getFullYear(), 11, 31);

async function main() {
    const existing = await prisma.product.count();
    if (existing > 0) {
        console.log(`Skipping: ${existing} products already exist.`);
        return;
    }

    await prisma.product.createMany({ data: CATALOGUE });
    await prisma.product.updateMany({
        where: { name: { in: HIDDEN } },
        data: { isEnabled: false },
    });
    console.log(`Created ${CATALOGUE.length} products.`);

    const idOf = async (name: string) => {
        const p = await prisma.product.findFirst({ where: { name } });
        if (!p) throw new Error(`Seed product missing: ${name}`);
        return p.id;
    };

    // The assignment's worked example: a 500g product across four slabs.
    await prisma.promotion.create({
        data: {
            title: 'Milk Powder Weighted Slabs',
            type: PromotionType.WEIGHTED,
            startDate: YEAR_START,
            endDate: YEAR_END,
            productId: await idOf('Milk Powder 500g'),
            slabs: {
                create: [
                    { minWeight: 1000, maxWeight: 5500, discountPerUnit: 2 },
                    { minWeight: 6000, maxWeight: 8500, discountPerUnit: 3 },
                    { minWeight: 9000, maxWeight: 11500, discountPerUnit: 4 },
                    { minWeight: 12000, maxWeight: null, discountPerUnit: 5 },
                ],
            },
        },
    });

    // Three slabs rather than four, to show the count is not fixed.
    await prisma.promotion.create({
        data: {
            title: 'Rice Wholesale Slabs',
            type: PromotionType.WEIGHTED,
            startDate: YEAR_START,
            endDate: YEAR_END,
            productId: await idOf('Miniket Rice 5kg'),
            slabs: {
                create: [
                    { minWeight: 10000, maxWeight: 25000, discountPerUnit: 10 },
                    { minWeight: 25001, maxWeight: 50000, discountPerUnit: 18 },
                    { minWeight: 50001, maxWeight: null, discountPerUnit: 25 },
                ],
            },
        },
    });

    await prisma.promotion.create({
        data: {
            title: 'Cooking Oil 8% Off',
            type: PromotionType.PERCENTAGE,
            startDate: YEAR_START,
            endDate: YEAR_END,
            productId: await idOf('Soybean Oil 5L'),
            percentageValue: 8,
        },
    });

    await prisma.promotion.create({
        data: {
            title: 'Sugar Sack Deal 25tk Off',
            type: PromotionType.FIXED,
            startDate: YEAR_START,
            endDate: YEAR_END,
            productId: await idOf('Refined Sugar 5kg'),
            fixedValue: 25,
        },
    });

    // Paused: enabled=false means it never applies, whatever the dates say.
    await prisma.promotion.create({
        data: {
            title: 'Tea Discount (paused)',
            type: PromotionType.PERCENTAGE,
            startDate: YEAR_START,
            endDate: YEAR_END,
            productId: await idOf('Tea Leaves 1kg'),
            percentageValue: 5,
            isEnabled: false,
        },
    });

    // Expired: enabled, but the window has closed.
    await prisma.promotion.create({
        data: {
            title: 'Lentil Eid Offer (expired)',
            type: PromotionType.FIXED,
            startDate: new Date(YEAR_START.getFullYear(), 2, 1),
            endDate: new Date(YEAR_START.getFullYear(), 3, 15),
            productId: await idOf('Red Lentil 1kg'),
            fixedValue: 8,
        },
    });

    console.log('Created 6 promotions covering every type and state.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
