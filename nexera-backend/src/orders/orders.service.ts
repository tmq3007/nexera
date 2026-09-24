import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentService } from '../payment/payment.service';
import {
  CheckoutDto,
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  UpdateShippingDto,
  UpdateRecipientDto,
  BulkUpdateOrdersDto,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  VALID_STATUS_TRANSITIONS,
} from './orders.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly paymentService: PaymentService,
  ) {}

  // ==========================================
  // CHECKOUT (Tạo đơn hàng mới)
  // ==========================================

  async checkout(dto: CheckoutDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Tìm customer theo authUserId (nếu đăng nhập) hoặc theo phone
    let customerId: string | null = null;
    if (dto.authUserId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', dto.authUserId)
        .maybeSingle();
      customerId = customer?.id || null;
    }

    if (!customerId && dto.customerPhone) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', dto.customerPhone)
        .maybeSingle();
      customerId = customer?.id || null;
    }

    // Nếu chưa có customer record, tạo mới
    if (!customerId) {
      const fullAddress = [
        dto.shippingAddress,
        dto.shippingWard,
        dto.shippingDistrict,
        dto.shippingProvince,
      ]
        .filter(Boolean)
        .join(', ');

      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert({
          auth_user_id: dto.authUserId || null,
          full_name: dto.customerName,
          phone: dto.customerPhone,
          email: dto.customerEmail || null,
          address: fullAddress,
          phone_numbers: [dto.customerPhone],
          emails: dto.customerEmail ? [dto.customerEmail] : [],
        })
        .select('id')
        .maybeSingle();

      if (custErr) {
        this.logger.error('Lỗi tạo customer:', custErr);
      }
      customerId = newCust?.id || null;
    }

    // 2. Validate sản phẩm: check tồn tại, giá, tồn kho
    const productIds = dto.items.map((it) => it.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, discount_rate, stock, image_url, sku, is_active')
      .in('id', productIds);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      throw new BadRequestException('Không tìm thấy thông tin sản phẩm.');
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Validate stock và tính giá
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      productImage: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      discountRate: number;
      totalPrice: number;
    }> = [];

    for (const item of dto.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new BadRequestException(`Sản phẩm với ID ${item.productId} không tồn tại.`);
      }
      if (!prod.is_active) {
        throw new BadRequestException(`Sản phẩm "${prod.name}" hiện không còn bán.`);
      }
      if (prod.stock !== null && prod.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${prod.name}" chỉ còn ${prod.stock} sản phẩm trong kho.`,
        );
      }

      const discountRate = Number(prod.discount_rate) || 0;
      const basePrice = Number(prod.price) || 0;
      const finalPrice =
        discountRate > 0 ? Math.round(basePrice * (1 - discountRate / 100)) : basePrice;
      const itemTotal = finalPrice * item.quantity;

      subtotal += itemTotal;
      validatedItems.push({
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image_url || '',
        productSku: prod.sku || '',
        quantity: item.quantity,
        unitPrice: finalPrice,
        discountRate,
        totalPrice: itemTotal,
      });
    }

    const totalAmount = subtotal; // shipping_fee = 0, discount = 0 for now

    // 4. Xác định trạng thái ban đầu & Xử lý tạo link PayOS nếu là Bank Transfer
    const isBankTransfer = dto.paymentMethod === PaymentMethod.BANK_TRANSFER;
    const initialStatus = isBankTransfer
      ? OrderStatus.PENDING_PAYMENT
      : OrderStatus.CONFIRMED;

    let checkoutUrl: string | null = null;
    let qrCode: string | null = null;
    let payosOrderCode: string | null = null;

    if (isBankTransfer) {
      try {
        const orderCodeNum = this.paymentService.generateOrderCode();
        payosOrderCode = String(orderCodeNum);

        const payosRes = await this.paymentService.createPayOSPaymentLink({
          orderCode: orderCodeNum,
          totalAmount,
          customer: {
            name: dto.customerName,
            phone: dto.customerPhone,
            email: dto.customerEmail,
            address: `${dto.shippingAddress}, ${dto.shippingWard}, ${dto.shippingDistrict}, ${dto.shippingProvince}`,
            notes: dto.note,
          },
          items: validatedItems.map((v) => ({
            name: v.productName,
            quantity: v.quantity,
            unitPrice: v.unitPrice,
          })),
        });

        checkoutUrl = payosRes.checkoutUrl || null;
        qrCode = payosRes.qrCode || null;
      } catch (payErr) {
        this.logger.error('Lỗi tạo link PayOS:', payErr);
        throw new BadRequestException('Không thể tạo link thanh toán. Vui lòng thử lại.');
      }
    }

    // 5. Tạo đơn hàng DUY NHẤT trong bảng `orders`
    const orderPayload = {
      customer_id: customerId,
      customer_name: dto.customerName,
      customer_email: dto.customerEmail || null,
      customer_phone: dto.customerPhone,
      shipping_address: dto.shippingAddress,
      shipping_ward: dto.shippingWard,
      shipping_district: dto.shippingDistrict,
      shipping_province: dto.shippingProvince,
      subtotal,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: totalAmount,
      payment_method: dto.paymentMethod,
      payment_status: PaymentStatus.UNPAID,
      status: initialStatus,
      payos_order_code: payosOrderCode,
      payos_checkout_url: checkoutUrl,
      note: dto.note || null,
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

    // 6. Lưu order_items (với product snapshot)
    const orderItemRows = validatedItems.map((v) => ({
      order_id: createdOrder.id,
      product_id: v.productId,
      product_name: v.productName,
      product_image: v.productImage,
      product_sku: v.productSku,
      quantity: v.quantity,
      unit_price: v.unitPrice,
      discount_rate: v.discountRate,
      total_price: v.totalPrice,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemRows);
    if (itemsErr) {
      this.logger.error('Lỗi lưu order items:', itemsErr);
    }

    // 7. Trừ tồn kho an toàn
    await this.deductStock(validatedItems);

    // 8. Ghi lịch sử trạng thái
    await this.logStatusChange(createdOrder.id, null, initialStatus, 'SYSTEM', 'Tạo đơn hàng mới');

    return {
      success: true,
      order: {
        id: createdOrder.id,
        orderCode: createdOrder.order_code,
        status: initialStatus,
        totalAmount,
        paymentMethod: dto.paymentMethod,
      },
      checkoutUrl,
      qrCode,
    };
  }

  // ==========================================
  // WEBHOOK: PayOS thanh toán thành công
  // ==========================================

  async handlePaymentWebhook(webhookBody: any) {
    let verifiedData: any;
    try {
      verifiedData = this.paymentService.verifyWebhook(webhookBody);
    } catch (err: any) {
      this.logger.error('Webhook xác thực chữ ký thất bại:', err);
      return { success: false, message: 'Invalid signature' };
    }

    const orderCode =
      verifiedData?.data?.orderCode ||
      verifiedData?.orderCode ||
      webhookBody?.data?.orderCode ||
      webhookBody?.orderCode;

    if (!orderCode) {
      return { success: false, message: 'Missing orderCode' };
    }

    const supabase = this.supabaseService.getClient();

    // Tìm đơn hàng theo payos_order_code
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('payos_order_code', String(orderCode))
      .maybeSingle();

    if (!order) {
      this.logger.warn(`Webhook: Không tìm thấy đơn với payos_order_code=${orderCode}`);
      return { success: false };
    }

    // Idempotent: nếu đã PAID thì bỏ qua
    if (order.payment_status === PaymentStatus.PAID) {
      this.logger.log(`Webhook: Đơn ${orderCode} đã PAID, bỏ qua.`);
      return { success: true, message: 'Đã xử lý trước đó' };
    }

    // Cập nhật trạng thái sang CONFIRMED và PAID
    const { error } = await supabase
      .from('orders')
      .update({
        status: OrderStatus.CONFIRMED,
        payment_status: PaymentStatus.PAID,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (error) {
      this.logger.error('Webhook update error:', error);
      return { success: false };
    }

    await this.logStatusChange(
      order.id,
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.CONFIRMED,
      'SYSTEM',
      'Thanh toán PayOS thành công',
    );

    this.logger.log(`Webhook: Đơn ${orderCode} → CONFIRMED + PAID`);
    return { success: true };
  }

  // ==========================================
  // PAYMENT STATUS (FE poll)
  // ==========================================

  async getPaymentStatus(orderId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_code, status, payment_status, payment_method, total_amount')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return data;
  }

  // ==========================================
  // CUSTOMER: Xem đơn hàng của mình
  // ==========================================

  async getMyOrders(authUserId: string) {
    if (!authUserId) return [];

    const supabase = this.supabaseService.getClient();

    const { data: cust } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (!cust) return [];

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(id, product_name, product_image, quantity, unit_price, total_price)')
      .eq('customer_id', cust.id)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Lỗi lấy đơn hàng:', error);
      return [];
    }

    return orders || [];
  }

  // ==========================================
  // CUSTOMER: Hủy đơn hàng
  // ==========================================

  async cancelOrder(orderId: string, authUserId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, customer_id, customers!inner(auth_user_id)')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');

    const custAuthId = (order as any).customers?.auth_user_id;
    if (custAuthId !== authUserId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này.');
    }

    // Chỉ cho hủy khi PENDING_PAYMENT hoặc CONFIRMED
    const cancellableStatuses = [OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException('Đơn hàng ở trạng thái này không thể hủy.');
    }

    const fromStatus = order.status;

    await supabase
      .from('orders')
      .update({
        status: OrderStatus.CANCELLED,
        cancelled_by: 'CUSTOMER',
        cancel_reason: 'Khách hàng yêu cầu hủy',
      })
      .eq('id', orderId);

    // Hoàn tồn kho
    await this.restoreStockByOrderId(orderId);

    await this.logStatusChange(orderId, fromStatus, OrderStatus.CANCELLED, 'CUSTOMER', 'Khách hàng hủy đơn');

    return { success: true };
  }

  // ==========================================
  // ADMIN: Danh sách đơn hàng
  // ==========================================

  async getAdminOrders(query: GetOrdersQueryDto) {
    const supabase = this.supabaseService.getClient();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('orders')
      .select(
        '*, order_items(id, product_name, product_image, quantity, unit_price, total_price)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.status && query.status !== 'all') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.paymentStatus) {
      dbQuery = dbQuery.eq('payment_status', query.paymentStatus);
    }

    if (query.paymentMethod) {
      dbQuery = dbQuery.eq('payment_method', query.paymentMethod);
    }

    if (query.search) {
      const q = query.search.trim();
      dbQuery = dbQuery.or(
        `order_code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`,
      );
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      this.logger.error('Lỗi lấy danh sách đơn hàng:', error);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  // ==========================================
  // ADMIN: Chi tiết đơn hàng
  // ==========================================

  async getAdminOrderById(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, slug, image_url))')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    // Lấy lịch sử trạng thái
    const { data: history } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    return { ...data, statusHistory: history || [] };
  }

  // ==========================================
  // ADMIN: Đổi trạng thái đơn hàng
  // ==========================================

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const supabase = this.supabaseService.getClient();

    // Lấy trạng thái hiện tại
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, payment_method')
      .eq('id', id)
      .maybeSingle();

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');

    const currentStatus = order.status as OrderStatus;
    const newStatus = dto.status;

    // Validate chuyển trạng thái hợp lệ
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ "${currentStatus}" sang "${newStatus}".`,
      );
    }

    // Build update payload
    const updatePayload: any = { status: newStatus };

    // Xử lý logic phụ theo trạng thái
    if (newStatus === OrderStatus.CONFIRMED && currentStatus === OrderStatus.PENDING_PAYMENT) {
      updatePayload.payment_status = PaymentStatus.PAID;
      updatePayload.paid_at = new Date().toISOString();
    }

    if (newStatus === OrderStatus.SHIPPED) {
      updatePayload.shipped_at = new Date().toISOString();
    }

    if (newStatus === OrderStatus.DELIVERED) {
      updatePayload.delivered_at = new Date().toISOString();
      // COD: khi giao thành công → đánh dấu đã thanh toán
      if (order.payment_method === PaymentMethod.COD) {
        updatePayload.payment_status = PaymentStatus.PAID;
        updatePayload.paid_at = new Date().toISOString();
      }
    }

    if (newStatus === OrderStatus.CANCELLED) {
      updatePayload.cancelled_by = 'ADMIN';
      updatePayload.cancel_reason = dto.note || 'Admin hủy đơn';
      // Hoàn tồn kho
      await this.restoreStockByOrderId(id);
    }

    if (newStatus === OrderStatus.RETURNED) {
      // Hoàn tồn kho
      await this.restoreStockByOrderId(id);
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Không thể cập nhật: ${error.message}`);
    }

    // Ghi lịch sử
    await this.logStatusChange(id, currentStatus, newStatus, dto.changedBy || 'ADMIN', dto.note);

    return data;
  }

  // ==========================================
  // ADMIN: Cập nhật thông tin vận chuyển
  // ==========================================

  async updateShipping(id: string, dto: UpdateShippingDto) {
    const supabase = this.supabaseService.getClient();

    const updatePayload: any = {};
    if (dto.shippingCarrier) updatePayload.shipping_carrier = dto.shippingCarrier;
    if (dto.trackingNumber) updatePayload.tracking_number = dto.trackingNumber;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Không thể cập nhật vận chuyển: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // ADMIN: Sửa thông tin người nhận (khi chưa gửi bưu cục)
  // ==========================================

  async updateRecipient(id: string, dto: UpdateRecipientDto) {
    const supabase = this.supabaseService.getClient();

    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');

    // Chỉ cho sửa khi chưa gửi bưu tá (PENDING_PAYMENT, CONFIRMED, PROCESSING)
    const editableStatuses = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
    ];

    if (!editableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        'Không thể sửa thông tin người nhận khi đơn đã gửi bưu cục hoặc đã kết thúc.',
      );
    }

    const updatePayload: any = {};
    if (dto.customerName) updatePayload.customer_name = dto.customerName;
    if (dto.customerPhone) updatePayload.customer_phone = dto.customerPhone;
    if (dto.shippingProvince) updatePayload.shipping_province = dto.shippingProvince;
    if (dto.shippingDistrict) updatePayload.shipping_district = dto.shippingDistrict;
    if (dto.shippingWard) updatePayload.shipping_ward = dto.shippingWard;
    if (dto.shippingAddress) updatePayload.shipping_address = dto.shippingAddress;
    if (dto.note !== undefined) updatePayload.note = dto.note;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Không thể cập nhật thông tin người nhận: ${error.message}`,
      );
    }

    await this.logStatusChange(
      id,
      order.status,
      order.status,
      'ADMIN',
      'Chỉnh sửa thông tin người nhận (SĐT/Địa chỉ)',
    );

    return data;
  }

  // ==========================================
  // ADMIN: Xóa đơn hàng
  // ==========================================

  async deleteOrder(id: string) {
    const supabase = this.supabaseService.getClient();
    await supabase.from('order_status_history').delete().eq('order_id', id);
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw new BadRequestException(`Không thể xóa: ${error.message}`);
    return { success: true };
  }

  // ==========================================
  // ADMIN: Bulk operations
  // ==========================================

  async bulkUpdateOrders(dto: BulkUpdateOrdersDto) {
    if (!dto.ids || dto.ids.length === 0) {
      throw new BadRequestException('Danh sách ID không được rỗng.');
    }

    const supabase = this.supabaseService.getClient();

    if (dto.action === 'delete') {
      await supabase.from('order_status_history').delete().in('order_id', dto.ids);
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
      if (error) throw new BadRequestException(`Lỗi cập nhật hàng loạt: ${error.message}`);
      return { success: true, count: dto.ids.length };
    }

    return { success: true, count: 0 };
  }

  // ==========================================
  // AUTO-CANCEL: Đơn CK hết hạn 15 phút
  // ==========================================

  async autoCancelExpiredOrders() {
    const supabase = this.supabaseService.getClient();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: expiredOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', OrderStatus.PENDING_PAYMENT)
      .lt('created_at', fifteenMinutesAgo);

    if (!expiredOrders || expiredOrders.length === 0) return { cancelled: 0 };

    for (const order of expiredOrders) {
      await supabase
        .from('orders')
        .update({
          status: OrderStatus.CANCELLED,
          cancelled_by: 'SYSTEM',
          cancel_reason: 'Hết hạn thanh toán (15 phút)',
        })
        .eq('id', order.id);

      await this.restoreStockByOrderId(order.id);
      await this.logStatusChange(
        order.id,
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.CANCELLED,
        'SYSTEM',
        'Hết hạn thanh toán 15 phút',
      );
    }

    this.logger.log(`Auto-cancelled ${expiredOrders.length} expired orders`);
    return { cancelled: expiredOrders.length };
  }

  // ==========================================
  // HELPER: Tồn kho
  // ==========================================

  private async deductStock(
    items: Array<{ productId: string; quantity: number }>,
  ) {
    const supabase = this.supabaseService.getClient();
    for (const item of items) {
      // Đọc stock hiện tại rồi trừ
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .maybeSingle();

      if (prod && prod.stock !== null) {
        const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.productId);
      }
    }
  }

  private async restoreStock(
    items: Array<{ productId: string; quantity: number }>,
  ) {
    const supabase = this.supabaseService.getClient();
    for (const item of items) {
      // Fallback: đọc stock hiện tại rồi cộng lại
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .maybeSingle();

      if (prod) {
        await supabase
          .from('products')
          .update({ stock: (prod.stock || 0) + item.quantity })
          .eq('id', item.productId);
      }
    }
  }

  private async restoreStockByOrderId(orderId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (items && items.length > 0) {
      await this.restoreStock(
        items.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
      );
    }
  }

  // ==========================================
  // HELPER: Ghi log thay đổi trạng thái
  // ==========================================

  private async logStatusChange(
    orderId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    note?: string,
  ) {
    const supabase = this.supabaseService.getClient();
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      note: note || null,
    });
  }

  // ==========================================
  // LEGACY: Tra cứu đơn hàng (backward compat)
  // ==========================================

  async getOrderLookup(codeOrId: string) {
    const supabase = this.supabaseService.getClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);

    const query = supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, image_url, slug))');

    if (isUuid) {
      query.eq('id', codeOrId);
    } else {
      query.or(`payos_order_code.eq.${codeOrId},order_code.eq.${codeOrId}`);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return data;
  }
}
