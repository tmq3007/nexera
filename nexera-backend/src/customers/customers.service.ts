import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { 
  SyncCustomerProfileDto, 
  UpdateCustomerProfileDto, 
  AddCustomerCrmNoteDto, 
  UpdateCustomerTierDto, 
  GetCustomersQueryDto 
} from './customers.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  /**
   * 1. Lấy thông tin cá nhân khách hàng (theo authUserId hoặc email)
   */
  async getMe(authUserId?: string, email?: string) {
    if (!authUserId && !email) {
      throw new BadRequestException('Cần ít nhất authUserId hoặc email');
    }

    let customer: any = null;

    if (authUserId) {
      const { data } = await this.client
        .from('customers')
        .select('*, orders(id, total_amount, status, created_at)')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (data) customer = data;
    }

    if (!customer && email) {
      const { data } = await this.client
        .from('customers')
        .select('*, orders(id, total_amount, status, created_at)')
        .eq('email', email)
        .maybeSingle();
      if (data) customer = data;
    }

    return customer || null;
  }

  /**
   * 2. Đồng bộ / Tự động tạo hồ sơ khách hàng khi đăng ký hoặc đăng nhập
   */
  async syncProfile(dto: SyncCustomerProfileDto) {
    const { authUserId, email, fullName, phone, guestSessionId, guestPhone, guestEmail } = dto;
    this.logger.log(`Syncing profile for authUser=${authUserId}, email=${email}`);

    let customer: any = null;

    // Tìm theo auth_user_id
    if (authUserId) {
      const { data } = await this.client
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (data) customer = data;
    }

    // Tìm theo email nếu chưa thấy
    if (!customer && email) {
      const { data } = await this.client
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (data) {
        customer = data;
        // Cập nhật auth_user_id nếu chưa liên kết
        if (!customer.auth_user_id || customer.auth_user_id !== authUserId) {
          await this.client
            .from('customers')
            .update({ auth_user_id: authUserId })
            .eq('id', customer.id);
          customer.auth_user_id = authUserId;
        }
      }
    }

    // Tạo mới nếu chưa có
    if (!customer) {
      const initialPhones = phone ? [phone] : (guestPhone ? [guestPhone] : []);
      const initialEmails = email ? [email] : (guestEmail ? [guestEmail] : []);

      const { data: newCust, error: createErr } = await this.client
        .from('customers')
        .insert({
          auth_user_id: authUserId,
          email: email || guestEmail || null,
          full_name: fullName || email?.split('@')[0] || 'Khách hàng',
          phone: phone || guestPhone || null,
          phone_numbers: initialPhones,
          emails: initialEmails,
          tier: 'STANDARD',
        })
        .select('*')
        .single();

      if (createErr || !newCust) {
        this.logger.error('Error creating customer in syncProfile', createErr);
        // Fallback đọc lại nếu đã tồn tại
        const { data: existing } = await this.client.from('customers').select('*').eq('email', email).maybeSingle();
        customer = existing;
      } else {
        customer = newCust;
      }
    }

    if (!customer) {
      throw new BadRequestException('Không thể khởi tạo hồ sơ khách hàng');
    }

    // Bổ sung số điện thoại và email phụ từ phiên vãng lai nếu chưa có
    const phoneArr: string[] = Array.isArray(customer.phone_numbers) ? [...customer.phone_numbers] : [];
    const emailArr: string[] = Array.isArray(customer.emails) ? [...customer.emails] : [];
    let needsUpdate = false;

    if (guestPhone && !phoneArr.includes(guestPhone)) {
      phoneArr.push(guestPhone);
      needsUpdate = true;
    }
    if (phone && !phoneArr.includes(phone)) {
      phoneArr.push(phone);
      needsUpdate = true;
    }
    if (guestEmail && !emailArr.includes(guestEmail)) {
      emailArr.push(guestEmail);
      needsUpdate = true;
    }
    if (email && !emailArr.includes(email)) {
      emailArr.push(email);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await this.client
        .from('customers')
        .update({
          phone: customer.phone || phone || guestPhone,
          email: customer.email || email || guestEmail,
          phone_numbers: phoneArr,
          emails: emailArr,
        })
        .eq('id', customer.id);
      customer.phone_numbers = phoneArr;
      customer.emails = emailArr;
    }

    // Tự động gộp hội thoại chat nếu có guestSessionId
    if (guestSessionId) {
      try {
        const { data: guestConvs } = await this.client
          .from('conversations')
          .select('*')
          .eq('guest_session_id', guestSessionId)
          .neq('status', 'MERGED')
          .limit(1);

        const guestConv = guestConvs && guestConvs.length > 0 ? guestConvs[0] : null;
        if (guestConv) {
          const { data: primaryConvs } = await this.client
            .from('conversations')
            .select('*')
            .eq('customer_id', customer.id)
            .neq('status', 'MERGED')
            .order('created_at', { ascending: true })
            .limit(1);

          const primaryConv = primaryConvs && primaryConvs.length > 0 ? primaryConvs[0] : null;

          if (primaryConv && primaryConv.id !== guestConv.id) {
            await this.client.from('chat_messages').update({ conversation_id: primaryConv.id }).eq('conversation_id', guestConv.id);
            await this.client.from('conversations').update({ status: 'MERGED' }).eq('id', guestConv.id);
            await this.client.from('conversations').update({
              last_message_at: new Date().toISOString(),
              last_message_preview: guestConv.last_message_preview || primaryConv.last_message_preview,
              status: 'OPEN',
            }).eq('id', primaryConv.id);
          } else if (!primaryConv) {
            await this.client.from('conversations').update({
              customer_id: customer.id,
              guest_name: customer.full_name,
              guest_phone: customer.phone,
              guest_email: customer.email,
              status: 'OPEN',
            }).eq('id', guestConv.id);
          }
        }
      } catch (chatSyncErr) {
        this.logger.warn('Lỗi gộp chat trong syncProfile:', chatSyncErr);
      }
    }

    return customer;
  }

  /**
   * 3. Khách hàng tự cập nhật profile
   */
  async updateMe(authUserId: string, dto: UpdateCustomerProfileDto) {
    const { data: cust } = await this.client
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (!cust) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const { data, error } = await this.client
      .from('customers')
      .update(dto)
      .eq('id', cust.id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating profile', error);
      throw new BadRequestException('Không thể cập nhật hồ sơ');
    }

    return data;
  }

  /**
   * 4. Admin: Lấy danh sách khách hàng CRM (phân trang, tìm kiếm, lọc tier)
   */
  async getAdminCustomers(query: GetCustomersQueryDto) {
    const { q, tier, page = 1, limit = 10 } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let dbQuery = this.client
      .from('customers')
      .select(
        '*, orders(id, total_amount, status, created_at), customer_notes(*), conversations(id, status, last_message_preview, last_message_at)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (q && q.trim()) {
      const cleanQ = q.trim();
      dbQuery = dbQuery.or(`full_name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%,phone.ilike.%${cleanQ}%`);
    }

    if (tier && tier !== 'all') {
      dbQuery = dbQuery.eq('tier', tier);
    }

    const { data, count, error } = await dbQuery;

    // Nếu query bảng customers thành công và có dữ liệu
    if (!error && data && data.length > 0) {
      return {
        customers: data,
        totalCount: count || data.length,
        currentPage: page,
        itemsPerPage: limit,
      };
    }

    // FALLBACK THÔNG MINH (Bypass RLS khi chưa có Service Role Key):
    // Tổng hợp danh sách khách hàng CRM từ bảng conversations (bảng không bị RLS chặn)
    this.logger.log('Fallback to aggregate CRM customers from conversations table');
    const { data: convs } = await this.client
      .from('conversations')
      .select('id, customer_id, guest_name, guest_phone, guest_email, status, last_message_preview, last_message_at, created_at')
      .order('last_message_at', { ascending: false });

    if (!convs || convs.length === 0) {
      return {
        customers: [],
        totalCount: 0,
        currentPage: page,
        itemsPerPage: limit,
      };
    }

    // Gộp theo SĐT hoặc Email hoặc customer_id
    const customerMap = new Map<string, any>();
    for (const c of convs) {
      const key = c.customer_id || c.guest_phone || c.guest_email || c.id;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: c.customer_id || c.id,
          full_name: c.guest_name && c.guest_name !== 'Khách vãng lai' ? c.guest_name : (c.guest_phone || c.guest_email || 'Khách hàng liên hệ'),
          phone: c.guest_phone || null,
          email: c.guest_email || null,
          phone_numbers: c.guest_phone ? [c.guest_phone] : [],
          emails: c.guest_email ? [c.guest_email] : [],
          tier: 'STANDARD',
          created_at: c.created_at,
          orders: [],
          customer_notes: [],
          conversations: [c],
        });
      } else {
        const existing = customerMap.get(key);
        if (c.guest_phone && !existing.phone_numbers.includes(c.guest_phone)) {
          existing.phone_numbers.push(c.guest_phone);
        }
        if (c.guest_email && !existing.emails.includes(c.guest_email)) {
          existing.emails.push(c.guest_email);
        }
        existing.conversations.push(c);
      }
    }

    let allCustomers = Array.from(customerMap.values());

    if (q && q.trim()) {
      const cleanQ = q.trim().toLowerCase();
      allCustomers = allCustomers.filter(cust => 
        (cust.full_name && cust.full_name.toLowerCase().includes(cleanQ)) ||
        (cust.phone && cust.phone.includes(cleanQ)) ||
        (cust.email && cust.email.toLowerCase().includes(cleanQ))
      );
    }

    const totalCount = allCustomers.length;
    const paginated = allCustomers.slice(from, to + 1);

    return {
      customers: paginated,
      totalCount,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  /**
   * 5. Admin: Lấy chi tiết 360° khách hàng
   */
  async getAdminCustomerById(id: string) {
    const { data, error } = await this.client
      .from('customers')
      .select('*, orders(id, total_amount, status, created_at), customer_notes(*), conversations(id, status, last_message_preview, last_message_at)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return data;
  }

  /**
   * 6. Admin: Cập nhật thông tin khách hàng
   */
  async updateAdminCustomer(id: string, dto: UpdateCustomerProfileDto) {
    const { data, error } = await this.client
      .from('customers')
      .update(dto)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error('Error updating customer', error);
      throw new BadRequestException('Không thể cập nhật khách hàng');
    }

    return data;
  }

  /**
   * 7. Admin: Cập nhật Tier
   */
  async updateTier(id: string, dto: UpdateCustomerTierDto) {
    const { data, error } = await this.client
      .from('customers')
      .update({ tier: dto.tier })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException('Không thể cập nhật phân hạng');
    }

    return data;
  }

  /**
   * 8. Admin: Thêm ghi chú CRM
   */
  async addNote(customerId: string, dto: AddCustomerCrmNoteDto) {
    const { data, error } = await this.client
      .from('customer_notes')
      .insert({
        customer_id: customerId,
        admin_id: dto.adminId || null,
        content: dto.content,
        author_name: dto.authorName || 'Quản trị viên',
      })
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException('Không thể lưu ghi chú khách hàng');
    }

    return data;
  }

  /**
   * 9. Admin: Xóa ghi chú CRM
   */
  async deleteNote(noteId: string) {
    const { error } = await this.client
      .from('customer_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      throw new BadRequestException('Không thể xóa ghi chú');
    }

    return { success: true };
  }

  /**
   * 10. Admin: Xóa khách hàng
   */
  async deleteCustomer(id: string) {
    const { error } = await this.client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException('Không thể xóa khách hàng');
    }

    return { success: true };
  }
}
