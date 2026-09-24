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
// Enums (Imported from common/enums)
// ==========================================

import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  OrderCancelledBy,
} from '../common/enums';

export {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  OrderCancelledBy,
};

// Quy tắc chuyển trạng thái hợp lệ
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.RETURNED]: [OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
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
  @IsOptional()
  @IsString()
  authUserId?: string;

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

  // Địa chỉ giao hàng
  @IsOptional()
  @IsString()
  shippingProvince?: string;

  @IsOptional()
  @IsString()
  shippingDistrict?: string;

  @IsOptional()
  @IsString()
  shippingWard?: string;

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

export class UpdateRecipientDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  shippingProvince?: string;

  @IsOptional()
  @IsString()
  shippingDistrict?: string;

  @IsOptional()
  @IsString()
  shippingWard?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  note?: string;
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
