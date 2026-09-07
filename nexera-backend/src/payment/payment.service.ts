import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePaymentOrderDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private payOS: PayOS | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (
      clientId &&
      apiKey &&
      checksumKey &&
      clientId !== 'your_payos_client_id'
    ) {
      try {
        this.payOS = new PayOS({ clientId, apiKey, checksumKey });
        this.logger.log('PayOS client initialized successfully.');
      } catch (err) {
        this.logger.error('Failed to initialize PayOS client:', err);
      }
    } else {
      this.logger.warn(
        'PayOS credentials are missing or placeholders. Mock/Test mode will be active until valid keys are configured in .env',
      );
    }
  }

  /**
   * Tạo mã đơn hàng số nguyên dương duy nhất cho PayOS (yêu cầu kiểu số nguyên)
   */
  private generateOrderCode(): number {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return Number(`${timestamp}${random}`);
  }

  /**
   * Tạo đơn hàng và link thanh toán PayOS hoặc COD
   */
  async createPaymentOrder(dto: CreatePaymentOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Kiểm tra và tính lại giá an toàn từ Supabase Database
    const productIds = dto.items.map((item) => item.productId);
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (dbError) {
      this.logger.warn(`Lỗi truy vấn sản phẩm: ${dbError.message}`);
    }

    const productMap = new Map<string, { id: string; name: string; price: number }>();
    if (dbProducts) {
      dbProducts.forEach((p) => productMap.set(p.id, p));
    }

    let calculatedTotal = 0;
    const itemsWithRealPrice = dto.items.map((item) => {
      const dbProduct = productMap.get(item.productId);
      const unitPrice = dbProduct ? Number(dbProduct.price) : Number(item.price || 0);
      const name = dbProduct ? dbProduct.name : item.name || 'Sản phẩm Nexera';
      calculatedTotal += unitPrice * item.quantity;
      return {
        productId: item.productId,
        name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

    if (calculatedTotal <= 0) {
      throw new BadRequestException('Tổng giá trị đơn hàng không hợp lệ.');
    }

    // 2. Tạo hoặc liên kết khách hàng trong Supabase
    let customerId: string | null = null;
    try {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', dto.customer.phone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            full_name: dto.customer.name,
            phone: dto.customer.phone,
            email: dto.customer.email || null,
            address: dto.customer.address,
          })
          .select('id')
          .single();

        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }
    } catch (custErr) {
      this.logger.warn('Không thể lưu customer, tiếp tục tạo đơn:', custErr);
    }

    // 3. Tạo mã đơn hàng số nguyên
    const orderCode = this.generateOrderCode();
    const isPayOS = dto.paymentMethod !== 'COD';

    // 4. Lưu đơn hàng vào bảng `orders`
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        total_amount: calculatedTotal,
        status: 'PENDING',
        payment_method: isPayOS ? 'PAYOS' : 'COD',
        payos_order_code: String(orderCode),
        note: dto.customer.notes || null,
      })
      .select('id')
      .single();

    if (orderError) {
      this.logger.error(`Lỗi tạo đơn hàng: ${orderError.message}`);
      throw new BadRequestException('Không thể lưu đơn hàng vào hệ thống.');
    }

    const orderId = orderData.id;

    // 5. Lưu chi tiết sản phẩm vào bảng `order_items`
    const orderItemsRows = itemsWithRealPrice.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsRows);

    if (itemsError) {
      this.logger.warn(`Lỗi lưu order_items: ${itemsError.message}`);
    }

    // 6. Nếu là COD thì hoàn tất ngay
    if (!isPayOS) {
      return {
        success: true,
        orderId,
        orderCode,
        paymentMethod: 'COD',
        totalAmount: calculatedTotal,
        message: 'Đơn hàng COD đã được ghi nhận thành công.',
      };
    }

    // 7. Tạo link thanh toán PayOS
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const payOSItems = itemsWithRealPrice.map((it) => ({
      name: it.name.slice(0, 50),
      quantity: it.quantity,
      price: Math.round(it.unitPrice),
    }));

    const paymentPayload = {
      orderCode,
      amount: Math.round(calculatedTotal),
      description: `DH${orderCode}`.slice(0, 25),
      items: payOSItems,
      cancelUrl: `${frontendUrl}/gio-hang?status=CANCELLED&orderCode=${orderCode}`,
      returnUrl: `${frontendUrl}/thanh-toan/ket-qua?status=PAID&orderCode=${orderCode}`,
      buyerName: dto.customer.name,
      buyerPhone: dto.customer.phone,
      buyerEmail: dto.customer.email || undefined,
      buyerAddress: dto.customer.address,
    };

    if (this.payOS) {
      try {
        const paymentResponse =
          await this.payOS.paymentRequests.create(paymentPayload);
        return {
          success: true,
          orderId,
          orderCode,
          paymentMethod: 'PAYOS',
          checkoutUrl: paymentResponse.checkoutUrl,
          qrCode: paymentResponse.qrCode,
          totalAmount: calculatedTotal,
        };
      } catch (payOSError: any) {
        this.logger.error('Lỗi gọi API PayOS:', payOSError);
        throw new BadRequestException(
          `Không thể tạo link PayOS: ${payOSError.message || 'Lỗi kết nối cổng thanh toán'}`,
        );
      }
    } else {
      // Chế độ mô phỏng khi chưa điền API keys thật
      this.logger.log(
        `[MOCK MODE] Giả lập tạo link PayOS cho đơn hàng ${orderCode}`,
      );
      const mockCheckoutUrl = `${frontendUrl}/thanh-toan/ket-qua?status=PAID&orderCode=${orderCode}&mock=true`;
      return {
        success: true,
        orderId,
        orderCode,
        paymentMethod: 'PAYOS',
        checkoutUrl: mockCheckoutUrl,
        qrCode: '',
        totalAmount: calculatedTotal,
        isMock: true,
        message:
          'Chế độ test PayOS (Điền PAYOS_CLIENT_ID và PAYOS_API_KEY vào nexera-backend/.env để kích hoạt cổng thật)',
      };
    }
  }

  /**
   * Xử lý Webhook gửi về từ PayOS
   */
  async handlePayOSWebhook(webhookBody: any) {
    this.logger.log('Nhận Webhook từ PayOS:', JSON.stringify(webhookBody));

    let verifiedData: any;

    if (this.payOS) {
      try {
        verifiedData = await this.payOS.webhooks.verify(webhookBody);
      } catch (verifyErr: any) {
        this.logger.error('Chữ ký Webhook PayOS không hợp lệ:', verifyErr);
        throw new BadRequestException('Chữ ký xác thực Webhook không hợp lệ.');
      }
    } else {
      // Mock / Dev verification
      verifiedData = webhookBody.data || webhookBody;
    }

    if (!verifiedData || !verifiedData.orderCode) {
      throw new BadRequestException('Dữ liệu Webhook thiếu thông tin đơn hàng.');
    }

    const orderCode = String(verifiedData.orderCode);
    const supabase = this.supabaseService.getClient();

    // Cập nhật trạng thái đơn hàng sang 'PAID'
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'PAID',
      })
      .eq('payos_order_code', orderCode)
      .select('id, status, total_amount')
      .single();

    if (updateError) {
      this.logger.error(
        `Lỗi cập nhật trạng thái đơn hàng ${orderCode}: ${updateError.message}`,
      );
      throw new BadRequestException('Không tìm thấy đơn hàng cần cập nhật.');
    }

    this.logger.log(
      `Cập nhật đơn hàng ${orderCode} sang trạng thái PAID thành công!`,
    );

    return {
      success: true,
      message: 'Cập nhật thanh toán thành công',
      order: updatedOrder,
    };
  }

  /**
   * Tra cứu trạng thái đơn hàng theo orderCode
   */
  async getOrderStatus(orderCode: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*)), customers(*)')
      .eq('payos_order_code', orderCode)
      .maybeSingle();

    if (error || !data) {
      throw new BadRequestException('Không tìm thấy thông tin đơn hàng.');
    }

    return data;
  }
}
