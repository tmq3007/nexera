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
  CreateOrderDto,
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  BulkUpdateOrdersDto,
} from './orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Tạo đơn hàng mới từ Storefront
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  /**
   * Khách hàng lấy danh sách đơn của mình
   */
  @Get('my-orders')
  async getMyOrders(
    @Query('authUserId') authUserId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.ordersService.getMyOrders(authUserId, customerId);
  }

  /**
   * Tra cứu đơn hàng theo mã đơn
   */
  @Get('lookup/:code')
  async getOrderLookup(@Param('code') code: string) {
    return this.ordersService.getOrderLookup(code);
  }

  /**
   * Admin: Danh sách đơn hàng phân trang
   */
  @Get('admin/list')
  async getAdminOrders(@Query() query: GetOrdersQueryDto) {
    return this.ordersService.getAdminOrders(query);
  }

  /**
   * Admin: Chi tiết đơn hàng
   */
  @Get('admin/:id')
  async getAdminOrderById(@Param('id') id: string) {
    return this.ordersService.getAdminOrderById(id);
  }

  /**
   * Admin: Cập nhật trạng thái đơn hàng
   */
  @Patch('admin/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  /**
   * Admin: Xóa đơn hàng
   */
  @Delete('admin/:id')
  async deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }

  /**
   * Admin: Cập nhật hàng loạt
   */
  @Patch('admin/bulk')
  async bulkUpdateOrders(@Body() dto: BulkUpdateOrdersDto) {
    return this.ordersService.bulkUpdateOrders(dto);
  }
}
