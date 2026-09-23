import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async validateCustomer(loginDto: LoginDto) {
    const { data: customer } = await this.supabaseService
      .getClient()
      .from('customers')
      .select('id, email, password_hash')
      .eq('email', loginDto.email)
      .single();

    if (!customer) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const isMatch = await bcrypt.compare(loginDto.password, customer.password_hash);
    if (!isMatch) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    return customer;
  }

  async validateAdmin(loginDto: LoginDto) {
    const { data: admin } = await this.supabaseService
      .getClient()
      .from('admin_accounts')
      .select('id, email, password_hash, role_id, is_active')
      .eq('email', loginDto.email)
      .single();

    if (!admin) throw new UnauthorizedException('Tài khoản không tồn tại');
    if (!admin.is_active) throw new UnauthorizedException('Tài khoản đã bị khóa');

    const isMatch = await bcrypt.compare(loginDto.password, admin.password_hash);
    if (!isMatch) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    // Get role name
    const { data: role } = await this.supabaseService
      .getClient()
      .from('roles')
      .select('name')
      .eq('id', admin.role_id)
      .single();

    return { ...admin, role: role?.name };
  }

  async loginCustomer(loginDto: LoginDto) {
    const user = await this.validateCustomer(loginDto);
    const payload = { sub: user.id, email: user.email, type: 'customer' };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginAdmin(loginDto: LoginDto) {
    const admin = await this.validateAdmin(loginDto);
    const payload = { sub: admin.id, email: admin.email, type: 'admin', role: admin.role };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async registerCustomer(registerDto: RegisterDto) {
    const { data: existing } = await this.supabaseService
      .getClient()
      .from('customers')
      .select('id')
      .eq('email', registerDto.email)
      .single();

    if (existing) throw new BadRequestException('Email đã tồn tại');

    const password_hash = await bcrypt.hash(registerDto.password, 10);

    const { data: newCustomer, error } = await this.supabaseService
      .getClient()
      .from('customers')
      .insert({
        email: registerDto.email,
        password_hash,
        full_name: registerDto.full_name,
        phone: registerDto.phone,
      })
      .select('id, email')
      .single();

    if (error) throw new BadRequestException(error.message);

    const payload = { sub: newCustomer.id, email: newCustomer.email, type: 'customer' };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
