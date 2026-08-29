import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [AuthModule, PrismaModule, ProductsModule, PromotionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
