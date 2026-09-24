import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CheckoutDto,
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  UpdateShippingDto,
  UpdateRecipientDto,
  BulkUpdateOrdersDto,
} from './orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ==========================================
  // CHECKOUT (Storefront)
  // ==========================================

  /**
   * Tạo đơn hàng mới (COD hoặc Bank Transfer)
   */
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Body() dto: CheckoutDto) {
    return this.ordersService.checkout(dto);
  }

  // ==========================================
  // WEBHOOK (PayOS)
  // ==========================================

  /**
   * Webhook nhận kết quả thanh toán từ PayOS
   * PayOS gọi endpoint này khi khách thanh toán thành công
   */
  @Post('webhook/payos')
  @HttpCode(HttpStatus.OK)
  async handlePayOSWebhook(@Body() body: any) {
    return this.ordersService.handlePaymentWebhook(body);
  }

  // ==========================================
  // PAYMENT STATUS (FE poll)
  // ==========================================

  /**
   * FE poll trạng thái thanh toán sau khi redirect từ PayOS
   */
  @Get(':id/payment-status')
  async getPaymentStatus(@Param('id') id: string) {
    return this.ordersService.getPaymentStatus(id);
  }

  // ==========================================
  // CUSTOMER (Storefront)
  // ==========================================

  /**
   * Khách xem danh sách đơn hàng của mình
   */
  @Get('my-orders')
  async getMyOrders(@Query('authUserId') authUserId: string) {
    return this.ordersService.getMyOrders(authUserId);
  }

  /**
   * Khách hủy đơn hàng
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id') id: string,
    @Body('authUserId') authUserId: string,
  ) {
    return this.ordersService.cancelOrder(id, authUserId);
  }

  // ==========================================
  // LEGACY: Tra cứu đơn hàng
  // ==========================================

  /**
   * Tra cứu đơn hàng theo mã đơn hoặc UUID
   */
  @Get('lookup/:code')
  async getOrderLookup(@Param('code') code: string) {
    return this.ordersService.getOrderLookup(code);
  }

  // ==========================================
  // ADMIN: Quản lý đơn hàng
  // ==========================================

  /**
   * Admin: Danh sách đơn hàng (filter, pagination, search)
   */
  @Get('admin/list')
  async getAdminOrders(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.getAdminOrders(query);
  }

  /**
   * Admin: Chi tiết đơn hàng (kèm lịch sử trạng thái)
   */
  @Get('admin/:id')
  async getAdminOrderById(@Param('id') id: string) {
    return this.ordersService.getAdminOrderById(id);
  }

  /**
   * Admin: Đổi trạng thái đơn hàng
   */
  @Patch('admin/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  /**
   * Admin: Cập nhật thông tin vận chuyển (mã vận đơn)
   */
  @Patch('admin/:id/shipping')
  async updateShipping(
    @Param('id') id: string,
    @Body() dto: UpdateShippingDto,
  ) {
    return this.ordersService.updateShipping(id, dto);
  }

  /**
   * Admin: Sửa thông tin người nhận (SĐT/Địa chỉ) khi chưa gửi bưu cục
   */
  @Patch('admin/:id/recipient')
  async updateRecipient(
    @Param('id') id: string,
    @Body() dto: UpdateRecipientDto,
  ) {
    return this.ordersService.updateRecipient(id, dto);
  }

  /**
   * Admin: Xóa đơn hàng
   */
  @Delete('admin/:id')
  async deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }

  /**
   * Admin: Thao tác hàng loạt
   */
  @Patch('admin/bulk')
  async bulkUpdateOrders(@Body() dto: BulkUpdateOrdersDto) {
    return this.ordersService.bulkUpdateOrders(dto);
  }

  // ==========================================
  // CRON: Auto-cancel expired orders
  // ==========================================

  /**
   * Endpoint gọi bởi cron job để auto-cancel đơn CK hết hạn
   * Có thể gọi bằng cron external hoặc NestJS @Cron
   */
  @Post('admin/auto-cancel-expired')
  @HttpCode(HttpStatus.OK)
  async autoCancelExpired() {
    return this.ordersService.autoCancelExpiredOrders();
  }
}
