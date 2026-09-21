import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SyncSessionDto, IdentifyContactDto, AdminConvertDto } from './chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  /**
   * Helper: Tìm khách hàng qua SĐT hoặc Email (bao gồm cả mảng phone_numbers và emails)
   */
  private async findCustomerByContact(phone?: string, email?: string) {
    const cleanPhone = phone?.trim() || null;
    const cleanEmail = email?.trim().toLowerCase() || null;

    if (!cleanPhone && !cleanEmail) return null;

    // 1. Tìm theo cột chính phone hoặc email
    let query = this.client.from('customers').select('*');
    if (cleanPhone && cleanEmail) {
      query = query.or(`phone.eq.${cleanPhone},email.eq.${cleanEmail}`);
    } else if (cleanPhone) {
      query = query.eq('phone', cleanPhone);
    } else if (cleanEmail) {
      query = query.eq('email', cleanEmail);
    }

    const { data: primaryMatches, error: primaryErr } = await query.limit(1);
    if (!primaryErr && primaryMatches && primaryMatches.length > 0) {
      return primaryMatches[0];
    }

    // 2. Tìm trong mảng phone_numbers nếu chưa thấy
    if (cleanPhone) {
      const { data: arrPhoneMatches } = await this.client
        .from('customers')
        .select('*')
        .contains('phone_numbers', [cleanPhone])
        .limit(1);
      if (arrPhoneMatches && arrPhoneMatches.length > 0) {
        return arrPhoneMatches[0];
      }
    }

    // 3. Tìm trong mảng emails nếu chưa thấy
    if (cleanEmail) {
      const { data: arrEmailMatches } = await this.client
        .from('customers')
        .select('*')
        .contains('emails', [cleanEmail])
        .limit(1);
      if (arrEmailMatches && arrEmailMatches.length > 0) {
        return arrEmailMatches[0];
      }
    }

    return null;
  }

  /**
   * 1. Đồng bộ và gộp phiên khi khách hàng đăng nhập
   */
  async syncSession(dto: SyncSessionDto) {
    const { guestSessionId, authUserId, email, fullName, phone, customerId } = dto;
    this.logger.log(`Syncing session for guest=${guestSessionId}, user=${authUserId || email}, custId=${customerId}`);

    // A. Xác định hồ sơ Customer
    let customer: any = null;

    if (customerId) {
      const { data: custById } = await this.client
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
      if (custById) customer = custById;
    }

    if (!customer && authUserId) {
      const { data: custByAuth } = await this.client
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (custByAuth) customer = custByAuth;
    }

    if (!customer && email) {
      const { data: custByEmail } = await this.client
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (custByEmail) {
        customer = custByEmail;
        if (authUserId && !customer.auth_user_id) {
          await this.client
            .from('customers')
            .update({ auth_user_id: authUserId })
            .eq('id', customer.id);
          customer.auth_user_id = authUserId;
        }
      }
    }

    // Nếu không tìm thấy hoặc chưa có hồ sơ, cố gắng tạo mới, có fallback nếu bị chặn bởi RLS
    const defaultName = fullName || email?.split('@')[0] || 'Khách hàng';
    if (!customer) {
      const { data: newCust, error: createCustErr } = await this.client
        .from('customers')
        .insert({
          auth_user_id: authUserId || null,
          email: email || null,
          full_name: defaultName,
          phone: phone || null,
          phone_numbers: phone ? [phone] : [],
          emails: email ? [email] : [],
          tier: 'POTENTIAL',
        })
        .select('*')
        .maybeSingle();

      if (!createCustErr && newCust) {
        customer = newCust;
      } else {
        this.logger.warn('Không thể insert customers (RLS), dùng fallback customer object:', createCustErr?.message);
        customer = {
          id: customerId || authUserId || 'cust_' + Math.random().toString(36).substring(2, 9),
          full_name: defaultName,
          email: email || null,
          phone: phone || null,
          phone_numbers: phone ? [phone] : [],
          emails: email ? [email] : [],
          tier: 'TIÊU CHUẨN',
        };
      }
    }

    // B. Tìm cuộc hội thoại vãng lai tương ứng với session
    const { data: guestConvs } = await this.client
      .from('conversations')
      .select('*')
      .eq('guest_session_id', guestSessionId)
      .neq('status', 'MERGED')
      .order('created_at', { ascending: false })
      .limit(1);

    const guestConv = guestConvs && guestConvs.length > 0 ? guestConvs[0] : null;

    // Tìm cuộc hội thoại chính thức của khách (nếu có trước đó)
    let primaryConv: any = null;

    // 1. Tìm theo customerId nếu có
    const targetCustId = customerId || customer?.id;
    if (targetCustId) {
      const { data: primaryConvs } = await this.client
        .from('conversations')
        .select('*')
        .eq('customer_id', targetCustId)
        .neq('status', 'MERGED')
        .order('created_at', { ascending: true })
        .limit(1);

      if (primaryConvs && primaryConvs.length > 0) {
        primaryConv = primaryConvs[0];
      }
    }

    // 2. Nếu chưa thấy và có email, tìm theo guest_email trong bảng conversations (Bypass RLS)
    if (!primaryConv && email) {
      const { data: convsByEmail } = await this.client
        .from('conversations')
        .select('*')
        .eq('guest_email', email)
        .neq('status', 'MERGED')
        .order('created_at', { ascending: true })
        .limit(1);

      if (convsByEmail && convsByEmail.length > 0) {
        primaryConv = convsByEmail[0];
        if (primaryConv.customer_id) {
          customer.id = primaryConv.customer_id;
        }
      }
    }

    // C. Cập nhật mảng phone_numbers / emails cho customer nếu có thể
    if (customer?.id && Array.isArray(customer.phone_numbers)) {
      const phoneArr: string[] = [...customer.phone_numbers];
      const emailArr: string[] = Array.isArray(customer.emails) ? [...customer.emails] : [];
      let shouldUpdateCustomer = false;

      if (guestConv?.guest_phone && !phoneArr.includes(guestConv.guest_phone)) {
        phoneArr.push(guestConv.guest_phone);
        shouldUpdateCustomer = true;
      }
      if (guestConv?.guest_email && !emailArr.includes(guestConv.guest_email)) {
        emailArr.push(guestConv.guest_email);
        shouldUpdateCustomer = true;
      }

      if (shouldUpdateCustomer) {
        try {
          await this.client
            .from('customers')
            .update({
              phone: customer.phone || guestConv?.guest_phone,
              email: customer.email || guestConv?.guest_email || email,
              phone_numbers: phoneArr,
              emails: emailArr,
            })
            .eq('id', customer.id);
          customer.phone_numbers = phoneArr;
          customer.emails = emailArr;
        } catch (e) {
          this.logger.warn('Bỏ qua cập nhật customers do RLS:', e);
        }
      }
    }

    // D. Xử lý gộp hội thoại
    // Trường hợp 1: Khách đã có hội thoại cũ và hội thoại vãng lai khác biệt -> Gộp toàn bộ
    if (primaryConv && guestConv && primaryConv.id !== guestConv.id) {
      this.logger.log(`Gộp hội thoại vãng lai ${guestConv.id} vào hội thoại chính ${primaryConv.id}`);

      // 1. Chuyển TẤT CẢ tin nhắn từ hội thoại vãng lai sang hội thoại chính
      await this.client
        .from('chat_messages')
        .update({ conversation_id: primaryConv.id })
        .eq('conversation_id', guestConv.id);

      // 2. Cập nhật người gửi CHỈ cho tin nhắn của KHÁCH HÀNG (không làm mất tên Admin)
      await this.client
        .from('chat_messages')
        .update({
          sender_id: customer.id,
          sender_name: customer.full_name,
        })
        .eq('conversation_id', primaryConv.id)
        .eq('sender_type', 'CUSTOMER');

      // 3. Đổi trạng thái hội thoại vãng lai thành MERGED (để không xuất hiện trùng lặp bên Admin)
      await this.client
        .from('conversations')
        .update({
          status: 'MERGED',
          customer_id: customer.id,
          guest_name: customer.full_name,
        })
        .eq('id', guestConv.id);

      // 4. Cập nhật hội thoại chính
      await this.client
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: guestConv.last_message_preview || primaryConv.last_message_preview,
          status: 'OPEN',
          customer_id: customer.id,
          guest_name: customer.full_name,
        })
        .eq('id', primaryConv.id);

      return {
        success: true,
        action: 'MERGED',
        conversationId: primaryConv.id,
        customer,
      };
    }

    // Trường hợp 2: Chưa có hội thoại cũ -> Nâng cấp trực tiếp hội thoại vãng lai thành chính thức
    if (guestConv) {
      await this.client
        .from('conversations')
        .update({
          customer_id: customer.id,
          guest_name: customer.full_name,
          guest_phone: customer.phone || guestConv.guest_phone,
          guest_email: customer.email || guestConv.guest_email || email,
          status: 'OPEN',
        })
        .eq('id', guestConv.id);

      await this.client
        .from('chat_messages')
        .update({
          sender_id: customer.id,
          sender_name: customer.full_name,
        })
        .eq('conversation_id', guestConv.id)
        .eq('sender_type', 'CUSTOMER');

      return {
        success: true,
        action: 'LINKED',
        conversationId: guestConv.id,
        customer,
      };
    }

    if (primaryConv) {
      this.logger.log(`Existing conversation returned on reload: ${primaryConv.id}`);
      return {
        success: true,
        action: 'EXISTING',
        conversationId: primaryConv.id,
        customer: {
          id: primaryConv.customer_id || customer?.id || authUserId,
          full_name: primaryConv.guest_name || customer?.full_name || defaultName,
          email: primaryConv.guest_email || email,
          phone: primaryConv.guest_phone || phone,
          tier: customer?.tier || 'TIÊU CHUẨN',
        },
      };
    }

    return {
      success: true,
      action: 'NONE',
      conversationId: null,
      customer,
    };
  }

  /**
   * 2. Nhận diện khách vãng lai khi để lại SĐT hoặc Email (Smart Identification)
   */
  async identifyContact(dto: IdentifyContactDto) {
    const { guestSessionId, phone, email, fullName } = dto;
    const cleanPhone = phone?.trim() || null;
    const cleanEmail = email?.trim().toLowerCase() || null;
    const cleanName = fullName?.trim() || null;

    if (!cleanPhone && !cleanEmail) {
      throw new BadRequestException('Vui lòng cung cấp ít nhất Số điện thoại hoặc Email');
    }

    this.logger.log(`Identifying guest contact: phone=${cleanPhone}, email=${cleanEmail}`);

    // Lấy cuộc hội thoại hiện tại của guest
    const { data: convs } = await this.client
      .from('conversations')
      .select('*')
      .eq('guest_session_id', guestSessionId)
      .neq('status', 'MERGED')
      .order('created_at', { ascending: false })
      .limit(1);

    const currentConv = convs && convs.length > 0 ? convs[0] : null;

    // Tìm kiếm khách hàng đã có trong database
    const existingCustomer = await this.findCustomerByContact(cleanPhone || undefined, cleanEmail || undefined);

    // TRƯỜNG HỢP A: ĐÃ TỒN TẠI KHÁCH HÀNG
    if (existingCustomer) {
      // Cập nhật SĐT / Email vào mảng nếu thiếu
      const phones: string[] = Array.isArray(existingCustomer.phone_numbers) ? [...existingCustomer.phone_numbers] : [];
      const emails: string[] = Array.isArray(existingCustomer.emails) ? [...existingCustomer.emails] : [];
      let needsCustUpdate = false;

      if (cleanPhone && !phones.includes(cleanPhone)) {
        phones.push(cleanPhone);
        needsCustUpdate = true;
      }
      if (cleanEmail && !emails.includes(cleanEmail)) {
        emails.push(cleanEmail);
        needsCustUpdate = true;
      }

      if (needsCustUpdate) {
        await this.client
          .from('customers')
          .update({
            phone_numbers: phones,
            emails: emails,
          })
          .eq('id', existingCustomer.id);
        existingCustomer.phone_numbers = phones;
        existingCustomer.emails = emails;
      }

      // Kiểm tra xem khách đã có hội thoại cũ khác chưa
      const { data: oldConvs } = await this.client
        .from('conversations')
        .select('*')
        .eq('customer_id', existingCustomer.id)
        .neq('status', 'MERGED')
        .neq('id', currentConv?.id || '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: true })
        .limit(1);

      const oldPrimaryConv = oldConvs && oldConvs.length > 0 ? oldConvs[0] : null;

      if (oldPrimaryConv && currentConv) {
        // Gộp toàn bộ tin nhắn từ phiên vãng lai vào hội thoại cũ
        await this.client
          .from('chat_messages')
          .update({ conversation_id: oldPrimaryConv.id })
          .eq('conversation_id', currentConv.id);

        // Chỉ cập nhật sender info cho tin nhắn của khách hàng
        await this.client
          .from('chat_messages')
          .update({
            sender_id: existingCustomer.id,
            sender_name: existingCustomer.full_name,
          })
          .eq('conversation_id', oldPrimaryConv.id)
          .eq('sender_type', 'CUSTOMER');

        await this.client
          .from('conversations')
          .update({
            status: 'MERGED',
            customer_id: existingCustomer.id,
            guest_name: existingCustomer.full_name,
          })
          .eq('id', currentConv.id);

        await this.client
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: currentConv.last_message_preview,
          })
          .eq('id', oldPrimaryConv.id);

        return {
          success: true,
          isExisting: true,
          hasAccount: !!existingCustomer.auth_user_id,
          customer: existingCustomer,
          conversationId: oldPrimaryConv.id,
        };
      }

      // Chưa có hội thoại cũ -> Gán trực tiếp hội thoại này cho khách
      if (currentConv) {
        await this.client
          .from('conversations')
          .update({
            customer_id: existingCustomer.id,
            guest_name: existingCustomer.full_name,
            guest_phone: existingCustomer.phone || cleanPhone,
            guest_email: existingCustomer.email || cleanEmail,
          })
          .eq('id', currentConv.id);

        await this.client
          .from('chat_messages')
          .update({
            sender_id: existingCustomer.id,
            sender_name: existingCustomer.full_name,
          })
          .eq('conversation_id', currentConv.id)
          .eq('sender_type', 'CUSTOMER');
      }

      return {
        success: true,
        isExisting: true,
        hasAccount: !!existingCustomer.auth_user_id,
        customer: existingCustomer,
        conversationId: currentConv?.id || null,
      };
    }

    // TRƯỜNG HỢP B: CHƯA TỒN TẠI KHÁCH HÀNG -> TẠO MỚI POTENTIAL CUSTOMER
    const { data: newCustomer, error: insertErr } = await this.client
      .from('customers')
      .insert({
        full_name: cleanName || 'Khách hàng tiềm năng',
        phone: cleanPhone,
        email: cleanEmail,
        phone_numbers: cleanPhone ? [cleanPhone] : [],
        emails: cleanEmail ? [cleanEmail] : [],
        tier: 'POTENTIAL',
        notes: 'Tự động nhận diện từ số điện thoại / email khi chat trực tuyến',
      })
      .select('*')
      .single();

    if (insertErr || !newCustomer) {
      this.logger.error('Failed to create potential customer', insertErr);
      throw new BadRequestException('Không thể tạo hồ sơ khách hàng tiềm năng');
    }

    if (currentConv) {
      await this.client
        .from('conversations')
        .update({
          customer_id: newCustomer.id,
          guest_name: newCustomer.full_name,
          guest_phone: cleanPhone,
          guest_email: cleanEmail,
        })
        .eq('id', currentConv.id);

      await this.client
        .from('chat_messages')
        .update({
          sender_id: newCustomer.id,
          sender_name: newCustomer.full_name,
        })
        .eq('conversation_id', currentConv.id)
        .eq('sender_type', 'CUSTOMER');
    }

    return {
      success: true,
      isExisting: false,
      hasAccount: false,
      customer: newCustomer,
      conversationId: currentConv?.id || null,
    };
  }

  /**
   * 3. Admin chủ động nhập thông tin chuyển đổi & liên kết khách hàng từ Cột CRM
   */
  async adminConvertOrLink(dto: AdminConvertDto) {
    const { conversationId, phone, email, fullName } = dto;
    const cleanPhone = phone?.trim() || null;
    const cleanEmail = email?.trim().toLowerCase() || null;
    const cleanName = fullName?.trim() || null;

    if (!cleanPhone && !cleanEmail) {
      throw new BadRequestException('Vui lòng cung cấp ít nhất Số điện thoại hoặc Email');
    }

    // Lấy cuộc hội thoại hiện tại
    const { data: conv, error: convErr } = await this.client
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convErr || !conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    this.logger.log(`Admin converting conversation ${conversationId}: phone=${cleanPhone}, email=${cleanEmail}`);

    // Kiểm tra xem khách đã có trong hệ thống chưa
    const existingCustomer = await this.findCustomerByContact(cleanPhone || undefined, cleanEmail || undefined);

    // TRƯỜNG HỢP 3A: KHÁCH HÀNG ĐÃ TỒN TẠI
    if (existingCustomer) {
      const phones: string[] = Array.isArray(existingCustomer.phone_numbers) ? [...existingCustomer.phone_numbers] : [];
      const emails: string[] = Array.isArray(existingCustomer.emails) ? [...existingCustomer.emails] : [];
      let needsCustUpdate = false;

      if (cleanPhone && !phones.includes(cleanPhone)) {
        phones.push(cleanPhone);
        needsCustUpdate = true;
      }
      if (cleanEmail && !emails.includes(cleanEmail)) {
        emails.push(cleanEmail);
        needsCustUpdate = true;
      }
      if (cleanName && existingCustomer.full_name !== cleanName) {
        existingCustomer.full_name = cleanName;
        needsCustUpdate = true;
      }

      if (needsCustUpdate) {
        await this.client
          .from('customers')
          .update({
            full_name: existingCustomer.full_name,
            phone_numbers: phones,
            emails: emails,
          })
          .eq('id', existingCustomer.id);
        existingCustomer.phone_numbers = phones;
        existingCustomer.emails = emails;
      }

      // Kiểm tra xem khách đã có hội thoại chính trước đó không
      const { data: oldConvs } = await this.client
        .from('conversations')
        .select('*')
        .eq('customer_id', existingCustomer.id)
        .neq('status', 'MERGED')
        .neq('id', conversationId)
        .order('created_at', { ascending: true })
        .limit(1);

      const primaryConv = oldConvs && oldConvs.length > 0 ? oldConvs[0] : null;

      if (primaryConv) {
        // Gộp tin nhắn sang hội thoại cũ
        await this.client
          .from('chat_messages')
          .update({
            conversation_id: primaryConv.id,
            sender_id: existingCustomer.id,
            sender_name: existingCustomer.full_name,
          })
          .eq('conversation_id', conversationId)
          .eq('sender_type', 'CUSTOMER');

        await this.client
          .from('conversations')
          .update({
            status: 'MERGED',
            customer_id: existingCustomer.id,
            guest_name: existingCustomer.full_name,
          })
          .eq('id', conversationId);

        await this.client
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: conv.last_message_preview,
          })
          .eq('id', primaryConv.id);

        return {
          success: true,
          action: 'LINKED_AND_MERGED',
          activeConversationId: primaryConv.id,
          customer: existingCustomer,
          message: `Đã liên kết và gộp vào hội thoại có sẵn của khách hàng ${existingCustomer.full_name}`,
        };
      }

      // Chưa có hội thoại cũ -> Gán trực tiếp hội thoại này cho khách
      await this.client
        .from('conversations')
        .update({
          customer_id: existingCustomer.id,
          guest_name: existingCustomer.full_name,
          guest_phone: existingCustomer.phone || cleanPhone,
          guest_email: existingCustomer.email || cleanEmail,
        })
        .eq('id', conversationId);

      await this.client
        .from('chat_messages')
        .update({
          sender_id: existingCustomer.id,
          sender_name: existingCustomer.full_name,
        })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'CUSTOMER');

      return {
        success: true,
        action: 'LINKED',
        activeConversationId: conversationId,
        customer: existingCustomer,
        message: `Đã liên kết hội thoại với khách hàng ${existingCustomer.full_name}`,
      };
    }

    // TRƯỜNG HỢP 3B: TẠO MỚI KHÁCH HÀNG TỪ ADMIN
    const { data: newCustomer, error: createErr } = await this.client
      .from('customers')
      .insert({
        full_name: cleanName || conv.guest_name || 'Khách hàng mới',
        phone: cleanPhone,
        email: cleanEmail,
        phone_numbers: cleanPhone ? [cleanPhone] : [],
        emails: cleanEmail ? [cleanEmail] : [],
        tier: 'POTENTIAL',
        notes: `Tạo mới thủ công bởi Admin từ cuộc hội thoại tư vấn #${conversationId.substring(0, 8)}`,
      })
      .select('*')
      .single();

    if (createErr || !newCustomer) {
      this.logger.error('Failed to create customer from admin conversion', createErr);
      throw new BadRequestException('Không thể tạo hồ sơ khách hàng mới');
    }

    await this.client
      .from('conversations')
      .update({
        customer_id: newCustomer.id,
        guest_name: newCustomer.full_name,
        guest_phone: cleanPhone,
        guest_email: cleanEmail,
      })
      .eq('id', conversationId);

    await this.client
      .from('chat_messages')
      .update({
        sender_id: newCustomer.id,
        sender_name: newCustomer.full_name,
      })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'CUSTOMER');

    return {
      success: true,
      action: 'CREATED_NEW',
      activeConversationId: conversationId,
      customer: newCustomer,
      message: `Đã tạo mới hồ sơ khách hàng ${newCustomer.full_name}`,
    };
  }

  /**
   * 4. Lấy danh sách hội thoại cho Admin (Bypass RLS với Service Role)
   */
  async getAdminConversations() {
    const { data, error } = await this.client
      .from('conversations')
      .select('*, customer:customers(id, full_name, email, phone, phone_numbers, emails, address, tier)')
      .neq('status', 'MERGED')
      .order('last_message_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching admin conversations', error);
      throw new BadRequestException('Không thể lấy danh sách hội thoại');
    }

    return data;
  }
}
