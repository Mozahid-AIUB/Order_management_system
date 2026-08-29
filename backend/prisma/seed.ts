// prisma/seed.ts
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@mozahid.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

async function main() {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // upsert keeps this safe to run on every container start.
    const admin = await prisma.admin.upsert({
        where: { email: ADMIN_EMAIL },
        update: {},
        create: {
            name: 'Admin',
            email: ADMIN_EMAIL,
            password: hashedPassword,
        },
    });

    console.log('Admin ready:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
