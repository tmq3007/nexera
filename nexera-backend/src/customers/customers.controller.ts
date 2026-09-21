import { Controller, Get, Post, Put, Patch, Delete, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { 
  SyncCustomerProfileDto, 
  UpdateCustomerProfileDto, 
  AddCustomerCrmNoteDto, 
  UpdateCustomerTierDto, 
  GetCustomersQueryDto 
} from './customers.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Lấy profile khách hàng hiện tại
   */
  @Get('me')
  async getMe(
    @Query('authUserId') authUserId?: string,
    @Query('email') email?: string,
  ) {
    return this.customersService.getMe(authUserId, email);
  }

  /**
   * Tự động tạo/đồng bộ hồ sơ khách hàng khi đăng ký hoặc đăng nhập
   */
  @Post('sync-profile')
  @HttpCode(HttpStatus.OK)
  async syncProfile(@Body() dto: SyncCustomerProfileDto) {
    return this.customersService.syncProfile(dto);
  }

  /**
   * Khách hàng tự cập nhật thông tin cá nhân
   */
  @Put('me')
  async updateMe(
    @Query('authUserId') authUserId: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.customersService.updateMe(authUserId, dto);
  }

  /**
   * Admin: Danh sách khách hàng CRM (phân trang, lọc, tìm kiếm)
   */
  @Get('admin/list')
  async getAdminCustomers(@Query() query: GetCustomersQueryDto) {
    return this.customersService.getAdminCustomers(query);
  }

  /**
   * Admin: Chi tiết 360° khách hàng
   */
  @Get('admin/:id')
  async getAdminCustomerById(@Param('id') id: string) {
    return this.customersService.getAdminCustomerById(id);
  }

  /**
   * Admin: Cập nhật thông tin khách hàng
   */
  @Put('admin/:id')
  async updateAdminCustomer(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.customersService.updateAdminCustomer(id, dto);
  }

  /**
   * Admin: Cập nhật phân hạng (Tier)
   */
  @Patch('admin/:id/tier')
  async updateTier(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerTierDto,
  ) {
    return this.customersService.updateTier(id, dto);
  }

  /**
   * Admin: Thêm ghi chú CRM
   */
  @Post('admin/:id/notes')
  async addNote(
    @Param('id') customerId: string,
    @Body() dto: AddCustomerCrmNoteDto,
  ) {
    return this.customersService.addNote(customerId, dto);
  }

  /**
   * Admin: Xóa ghi chú CRM
   */
  @Delete('admin/notes/:noteId')
  async deleteNote(@Param('noteId') noteId: string) {
    return this.customersService.deleteNote(noteId);
  }

  /**
   * Admin: Xóa khách hàng
   */
  @Delete('admin/:id')
  async deleteCustomer(@Param('id') id: string) {
    return this.customersService.deleteCustomer(id);
  }
}
