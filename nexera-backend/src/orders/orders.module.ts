import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [SupabaseModule, PaymentModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
