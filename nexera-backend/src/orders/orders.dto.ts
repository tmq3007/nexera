import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// Enums
// ==========================================

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUNDED = 'REFUNDED',
  RETURNED = 'RETURNED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  COD = 'COD',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

// Quy tắc chuyển trạng thái hợp lệ
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUND_REQUESTED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUND_REQUESTED]: [OrderStatus.REFUNDED, OrderStatus.DELIVERED],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.RETURNED]: [OrderStatus.CANCELLED],
};

// ==========================================
// Checkout DTOs
// ==========================================

export class CheckoutItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  authUserId: string;

  // Thông tin khách hàng
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  // Địa chỉ giao hàng (cascading dropdown)
  @IsString()
  @IsNotEmpty()
  shippingProvince: string;

  @IsString()
  @IsNotEmpty()
  shippingDistrict: string;

  @IsString()
  @IsNotEmpty()
  shippingWard: string;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string; // Số nhà, tên đường

  // Thanh toán
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  // Ghi chú
  @IsOptional()
  @IsString()
  note?: string;

  // Sản phẩm
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}

// ==========================================
// Admin Order Management DTOs
// ==========================================

export class GetOrdersQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  changedBy?: string; // Email admin
}

export class UpdateShippingDto {
  @IsOptional()
  @IsString()
  shippingCarrier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

// ==========================================
// Legacy DTOs (giữ cho backward compatibility)
// ==========================================

export class CreateOrderDto extends CheckoutDto {}

export class BulkUpdateOrdersDto {
  @IsArray()
  ids: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  action?: 'delete' | 'update_status';
}
