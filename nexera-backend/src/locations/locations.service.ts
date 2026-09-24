import { Injectable } from '@nestjs/common';
import {
  VIETNAM_ADDRESS,
  ProvinceItem,
  WardItem,
} from '../common/data/vietnam-address.data';

export type { ProvinceItem, WardItem };

@Injectable()
export class LocationsService {
  /**
   * Lấy danh sách Tỉnh / Thành phố trực thuộc trung ương sau sáp nhập
   */
  getProvinces(): { code: number; name: string; division_type?: string }[] {
    return VIETNAM_ADDRESS.map((p) => ({
      code: p.code,
      name: p.name,
      division_type: p.division_type,
    }));
  }

  /**
   * Lấy danh sách Xã / Phường trực thuộc Tỉnh / Thành phố (v2 sau sáp nhập)
   */
  getWards(provinceCode: number): { code: number; name: string; division_type?: string }[] {
    const province = VIETNAM_ADDRESS.find((p) => p.code === provinceCode);
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
