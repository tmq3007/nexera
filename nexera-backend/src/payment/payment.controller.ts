import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentOrderDto } from './dto/create-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createPaymentOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.paymentService.createPaymentOrder(dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookBody: any) {
    return this.paymentService.handlePayOSWebhook(webhookBody);
  }

  @Get('order/:orderCode')
  async getOrderStatus(@Param('orderCode') orderCode: string) {
    return this.paymentService.getOrderStatus(orderCode);
  }
}
