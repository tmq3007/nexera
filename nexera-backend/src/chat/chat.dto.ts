import { IsNotEmpty, IsOptional, IsString, IsArray, IsIn } from 'class-validator';

export class SyncSessionDto {
  @IsString()
  @IsNotEmpty()
  guestSessionId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  authUserId?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class IdentifyContactDto {
  @IsString()
  @IsNotEmpty()
  guestSessionId: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}

export class AdminConvertDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}

export class GetConversationDto {
  @IsString()
  @IsNotEmpty()
  guestSessionId: string;

  @IsString()
  @IsOptional()
  authUserId?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  customerId?: string;
}

export class SendMessageDto {
  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  guestSessionId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];

  @IsString()
  @IsIn(['CUSTOMER', 'ADMIN', 'SYSTEM'])
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';

  @IsString()
  @IsNotEmpty()
  senderName: string;

  @IsString()
  @IsOptional()
  senderId?: string;
}

export class AssignAdminDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  adminId: string;
}

export class UpdateConversationStatusDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsIn(['OPEN', 'RESOLVED', 'CLOSED'])
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
}

export class AddCustomerNoteDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  authorName?: string;
}

