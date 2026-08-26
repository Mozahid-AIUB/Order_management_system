// prisma/seed.ts
//import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.admin.create({
        data: {
            name: 'Admin',
            email: 'admin@mozahid.com',
            password: hashedPassword,
        },
    });

    console.log('Seeded admin:', admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
