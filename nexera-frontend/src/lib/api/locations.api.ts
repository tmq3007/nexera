import { api } from './client';

export interface Province {
  code: number;
  name: string;
  division_type?: string;
}

export interface District {
  code: number;
  name: string;
  division_type?: string;
}

export interface Ward {
  code: number;
  name: string;
  division_type?: string;
}

export const locationsApi = {
  /**
   * Lấy danh sách Tỉnh/Thành phố sau sáp nhập từ Backend (Offline JSON v2)
   */
  getProvinces: () =>
    api.get<Province[]>('/locations/provinces', { revalidate: false }),

  /**
   * Lấy danh sách Xã/Phường theo mã Tỉnh/Thành phố từ Backend (Offline JSON v2)
   */
  getWards: (provinceCode: number) =>
    api.get<Ward[]>('/locations/wards', {
      params: { provinceCode },
      revalidate: false,
    }),
};
