import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentService } from '../payment/payment.service';
import {
  CreateOrderDto,
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  BulkUpdateOrdersDto,
} from './orders.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Tạo đơn hàng mới an toàn từ Backend
   */
  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Tìm hoặc tạo khách hàng
    let customerId = dto.customerId;
    if (!customerId) {
      // Tìm theo authUserId hoặc phone/email
      let custQuery = supabase.from('customers').select('id');
      if (dto.authUserId) {
        custQuery = custQuery.eq('auth_user_id', dto.authUserId);
      } else if (dto.customerPhone) {
        custQuery = custQuery.eq('phone', dto.customerPhone);
      }

      const { data: existingCust } = await custQuery.maybeSingle();

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        // Tạo customer mới
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({
            auth_user_id: dto.authUserId || null,
            full_name: dto.customerName,
            phone: dto.customerPhone,
            email: dto.customerEmail || null,
            address: dto.shippingAddress,
            phone_numbers: dto.customerPhone ? [dto.customerPhone] : [],
            emails: dto.customerEmail ? [dto.customerEmail] : [],
          })
          .select('id')
          .maybeSingle();

        if (!custErr && newCust) {
          customerId = newCust.id;
        }
      }
    }

    // 2. Lấy giá sản phẩm thật từ DB để tính toán an toàn
    const productIds = dto.items.map((it) => it.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, discount_rate, stock')
      .in('id', productIds);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      throw new BadRequestException('Không tìm thấy thông tin các sản phẩm đã chọn.');
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalAmount = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of dto.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
      }

      const discountRate = Number(prod.discount_rate) || 0;
      const basePrice = Number(prod.price) || 0;
      const finalPrice = discountRate > 0 ? Math.round(basePrice * (1 - discountRate / 100)) : basePrice;
      const itemTotal = finalPrice * item.quantity;

      totalAmount += itemTotal;
      validatedItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitPrice: finalPrice,
        totalPrice: itemTotal,
      });
    }

    // 3. Tạo orderCode duy nhất
    const orderCode = Number(`${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`);

    // 4. Lưu đơn hàng vào bảng `orders`
    const orderPayload = {
      customer_id: customerId || null,
      total_amount: totalAmount,
      status: 'PENDING',
      payment_method: dto.paymentMethod || 'COD',
      payos_order_code: String(orderCode),
      note: dto.note ? `${dto.note} | Giao tới: ${dto.shippingAddress}` : `Giao tới: ${dto.shippingAddress}`,
    };

    const { data: createdOrder, error: orderErr } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) {
      this.logger.error('Lỗi tạo đơn hàng:', orderErr);
      throw new BadRequestException(`Không thể tạo đơn hàng: ${orderErr.message}`);
    }

    // 5. Lưu order_items
    const orderItemRows = validatedItems.map((v) => ({
      order_id: createdOrder.id,
      product_id: v.productId,
      quantity: v.quantity,
      unit_price: v.unitPrice,
      total_price: v.totalPrice,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemRows);
    if (itemsErr) {
      this.logger.error('Lỗi lưu order items:', itemsErr);
    }

    // 6. Xử lý thanh toán trực tuyến PayOS nếu người dùng chọn PAYOS
    let checkoutUrl: string | null = null;
    let qrCode: string | null = null;

    if (dto.paymentMethod === 'PAYOS') {
      try {
        const payosRes = await this.paymentService.createPaymentOrder({
          customer: {
            name: dto.customerName,
            phone: dto.customerPhone,
            email: dto.customerEmail,
            address: dto.shippingAddress,
            notes: dto.note,
          },
          items: validatedItems.map((v) => ({
            productId: v.productId,
            name: v.productName,
            quantity: v.quantity,
            price: v.unitPrice,
          })),
          paymentMethod: 'PAYOS',
        });

        checkoutUrl = payosRes.checkoutUrl || null;
        qrCode = payosRes.qrCode || null;
      } catch (payErr) {
        this.logger.warn('Không thể tạo liên kết PayOS, chuyển về chế độ thanh toán thông thường:', payErr);
      }
    }

    return {
      success: true,
      order: createdOrder,
      orderCode,
      totalAmount,
      checkoutUrl,
      qrCode,
      items: validatedItems,
    };
  }

  /**
   * Lấy danh sách đơn hàng của khách đang đăng nhập
   */
  async getMyOrders(authUserId?: string, customerId?: string) {
    if (!authUserId && !customerId) {
      return [];
    }

    const supabase = this.supabaseService.getClient();

    let targetCustId = customerId;
    if (!targetCustId && authUserId) {
      const { data: cust } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (cust) targetCustId = cust.id;
    }

    if (!targetCustId) return [];

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, image_url, slug))')
      .eq('customer_id', targetCustId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Lỗi lấy đơn hàng của tôi:', error);
      return [];
    }

    return orders || [];
  }

  /**
   * Tra cứu đơn hàng theo mã đơn hoặc UUID
   */
  async getOrderLookup(codeOrId: string) {
    const supabase = this.supabaseService.getClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);

    const query = supabase
      .from('orders')
      .select('*, customers(id, full_name, phone, email, address), order_items(*, products(id, name, image_url, slug))');

    if (isUuid) {
      query.eq('id', codeOrId);
    } else {
      query.eq('payos_order_code', codeOrId);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Không tìm thấy đơn hàng tương ứng');
    }

    return data;
  }

  /**
   * Admin: Danh sách đơn hàng phân trang, lọc trạng thái, tìm kiếm
   */
  async getAdminOrders(query: GetOrdersQueryDto) {
    const supabase = this.supabaseService.getClient();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('orders')
      .select('*, customers(id, full_name, phone, email), order_items(id, quantity, unit_price, total_price, products(name, image_url))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
      const q = query.search.trim();
      dbQuery = dbQuery.or(`payos_order_code.ilike.%${q}%,note.ilike.%${q}%`);
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      this.logger.error('Lỗi lấy danh sách đơn hàng Admin:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const total = count || 0;
    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Chi tiết đơn hàng
   */
  async getAdminOrderById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*), order_items(*, products(*))')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng.');
    }

    return data;
  }

  /**
   * Admin: Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status: dto.status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi cập nhật trạng thái đơn hàng:', error);
      throw new BadRequestException(`Không thể cập nhật trạng thái: ${error.message}`);
    }

    return data;
  }

  /**
   * Admin: Xóa đơn hàng
   */
  async deleteOrder(id: string) {
    const supabase = this.supabaseService.getClient();
    // Xóa order_items trước nếu không có cascade
    await supabase.from('order_items').delete().eq('order_id', id);

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      this.logger.error('Lỗi xóa đơn hàng:', error);
      throw new BadRequestException(`Không thể xóa đơn hàng: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Admin: Cập nhật / Xóa đơn hàng hàng loạt
   */
  async bulkUpdateOrders(dto: BulkUpdateOrdersDto) {
    if (!dto.ids || dto.ids.length === 0) {
      throw new BadRequestException('Danh sách ID đơn hàng không được rỗng.');
    }

    const supabase = this.supabaseService.getClient();

    if (dto.action === 'delete') {
      await supabase.from('order_items').delete().in('order_id', dto.ids);
      const { error } = await supabase.from('orders').delete().in('id', dto.ids);
      if (error) throw new BadRequestException(`Lỗi xóa hàng loạt: ${error.message}`);
      return { success: true, count: dto.ids.length };
    }

    if (dto.status) {
      const { error } = await supabase
        .from('orders')
        .update({ status: dto.status })
        .in('id', dto.ids);

      if (error) throw new BadRequestException(`Lỗi cập nhật trạng thái hàng loạt: ${error.message}`);
      return { success: true, count: dto.ids.length };
    }

    return { success: true, count: 0 };
  }
}
