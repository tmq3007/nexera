import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key-please-change-in-production',
    });
  }

  async validate(payload: any) {
    // payload: { sub: id, email: string, type: 'admin' | 'customer', role?: string }
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { 
      id: payload.sub, 
      email: payload.email, 
      type: payload.type, 
      role: payload.role 
    };
  }
}
