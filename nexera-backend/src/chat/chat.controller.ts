import { Controller, Post, Get, Patch, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { 
  SyncSessionDto, 
  IdentifyContactDto, 
  AdminConvertDto, 
  GetConversationDto, 
  SendMessageDto, 
  AssignAdminDto,
  UpdateConversationStatusDto,
  AddCustomerNoteDto
} from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Lấy hoặc khởi tạo hội thoại hợp lệ duy nhất của khách (Storefront)
   * Trả về cả conversation, customer và toàn bộ messages
   */
  @Get('conversation')
  async getConversation(@Query() query: GetConversationDto) {
    return this.chatService.getConversation(query);
  }

  /**
   * Lấy danh sách tin nhắn theo conversationId
   */
  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  /**
   * Gửi tin nhắn mới (Storefront hoặc Admin)
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  /**
   * Đồng bộ & gộp phiên vãng lai khi khách hàng đăng nhập
   */
  @Post('sync-session')
  @HttpCode(HttpStatus.OK)
  async syncSession(@Body() dto: SyncSessionDto) {
    return this.chatService.syncSession(dto);
  }

  /**
   * Cập nhật thông tin khách để lại từ form chat
   */
  @Post('identify-contact')
  @HttpCode(HttpStatus.OK)
  async identifyContact(@Body() dto: IdentifyContactDto) {
    return this.chatService.identifyContact(dto);
  }

  /**
   * Admin tạo mới/liên kết khách hàng từ hội thoại
   */
  @Post('admin-convert')
  @HttpCode(HttpStatus.OK)
  async adminConvert(@Body() dto: AdminConvertDto) {
    return this.chatService.adminConvertOrLink(dto);
  }

  /**
   * Admin phân công tư vấn viên
   */
  @Post('admin/assign')
  @HttpCode(HttpStatus.OK)
  async assignAdmin(@Body() dto: AssignAdminDto) {
    return this.chatService.assignAdmin(dto);
  }

  /**
   * Admin cập nhật trạng thái hội thoại (OPEN / RESOLVED / CLOSED)
   */
  @Patch('admin/conversation-status')
  @HttpCode(HttpStatus.OK)
  async updateConversationStatus(@Body() dto: UpdateConversationStatusDto) {
    return this.chatService.updateConversationStatus(dto);
  }

  /**
   * Admin thêm ghi chú khách hàng
   */
  @Post('admin/customer-notes')
  @HttpCode(HttpStatus.OK)
  async addCustomerNote(@Body() dto: AddCustomerNoteDto) {
    return this.chatService.addCustomerNote(dto);
  }

  /**
   * Admin xem thông tin 360 khách hàng (Orders & Notes)
   */
  @Get('admin/customer-details/:customerId')
  async getCustomerDetails(@Param('customerId') customerId: string) {
    return this.chatService.getCustomerDetails(customerId);
  }

  /**
   * Danh sách hội thoại dành cho Admin CRM
   */
  @Get('admin/conversations')
  async getAdminConversations() {
    return this.chatService.getAdminConversations();
  }

  /**
   * Lấy thông tin tài khoản Admin theo authUserId
   */
  @Get('admin/info/:authUserId')
  async getAdminInfo(@Param('authUserId') authUserId: string) {
    return this.chatService.getAdminInfo(authUserId);
  }

  /**
   * Lấy sản phẩm gửi nhanh trong chat
   */
  @Get('products-quick')
  async getQuickProducts() {
    return this.chatService.getQuickProducts();
  }
}

