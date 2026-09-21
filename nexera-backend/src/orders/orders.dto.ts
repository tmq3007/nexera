import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  authUserId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsString()
  shippingAddress: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // 'PAYOS' | 'COD' | 'BANK_TRANSFER'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class GetOrdersQueryDto {
  @IsOptional()
  @IsString()
  status?: string; // 'PENDING' | 'PAID' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string; // 'PENDING' | 'PAID' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
}

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
