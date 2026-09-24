import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export interface WardItem {
  code: number;
  name: string;
  division_type?: string;
}

export interface ProvinceItem {
  code: number;
  name: string;
  division_type?: string;
  wards: WardItem[];
}

@Injectable()
export class LocationsService implements OnModuleInit {
  private readonly logger = new Logger(LocationsService.name);
  private provincesData: ProvinceItem[] = [];

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      const candidates = [
        path.join(__dirname, '..', 'common', 'data', 'vietnam-address.json'),
        path.join(process.cwd(), 'src', 'common', 'data', 'vietnam-address.json'),
        path.join(process.cwd(), 'dist', 'src', 'common', 'data', 'vietnam-address.json'),
        path.join(process.cwd(), 'dist', 'common', 'data', 'vietnam-address.json'),
        path.join(__dirname, '..', '..', 'src', 'common', 'data', 'vietnam-address.json'),
      ];

      let raw: string | null = null;
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          raw = fs.readFileSync(p, 'utf8');
          this.logger.log(`Nạp dữ liệu địa giới hành chính Việt Nam (v2 sau sáp nhập) từ: ${p}`);
          break;
        }
      }

      if (raw) {
        this.provincesData = JSON.parse(raw);
        this.logger.log(
          `Đã nạp thành công ${this.provincesData.length} Tỉnh/Thành phố và xã/phường sau sáp nhập từ file JSON offline.`
        );
      } else {
        this.logger.warn('CẢNH BÁO: Không tìm thấy file vietnam-address.json!');
      }
    } catch (err) {
      this.logger.error('Lỗi khi nạp dữ liệu địa chỉ offline:', err);
    }
  }

  /**
   * Lấy danh sách Tỉnh / Thành phố trực thuộc trung ương sau sáp nhập
   */
  getProvinces(): { code: number; name: string; division_type?: string }[] {
    return this.provincesData.map((p) => ({
      code: p.code,
      name: p.name,
      division_type: p.division_type,
    }));
  }

  /**
   * Lấy danh sách Xã / Phường trực thuộc Tỉnh / Thành phố (v2 sau sáp nhập)
   */
  getWards(provinceCode: number): { code: number; name: string; division_type?: string }[] {
    const province = this.provincesData.find((p) => p.code === provinceCode);
    if (!province) return [];
    return province.wards.map((w) => ({
      code: w.code,
      name: w.name,
      division_type: w.division_type,
    }));
  }

  /**
   * Tương thích ngược: lấy danh sách quận huyện (v2 đã sáp nhập nên trả về rỗng)
   */
  getDistricts(provinceCode: number): { code: number; name: string }[] {
    return [];
  }
}
