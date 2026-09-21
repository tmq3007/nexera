import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SyncSessionDto, IdentifyContactDto, AdminConvertDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sync-session')
  @HttpCode(HttpStatus.OK)
  async syncSession(@Body() dto: SyncSessionDto) {
    return this.chatService.syncSession(dto);
  }

  @Post('identify-contact')
  @HttpCode(HttpStatus.OK)
  async identifyContact(@Body() dto: IdentifyContactDto) {
    return this.chatService.identifyContact(dto);
  }

  @Post('admin-convert')
  @HttpCode(HttpStatus.OK)
  async adminConvert(@Body() dto: AdminConvertDto) {
    return this.chatService.adminConvertOrLink(dto);
  }

  @Get('admin/conversations')
  async getAdminConversations() {
    return this.chatService.getAdminConversations();
  }
}
