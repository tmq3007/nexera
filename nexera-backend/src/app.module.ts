import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { PaymentModule } from './payment/payment.module';
import { ChatModule } from './chat/chat.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ContentModule } from './content/content.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RbacModule } from './rbac/rbac.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    PaymentModule,
    ChatModule,
    CustomersModule,
    ProductsModule,
    OrdersModule,
    ContentModule,
    AnalyticsModule,
    RbacModule,
    UploadModule,
    AuthModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
