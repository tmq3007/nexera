import { BACKEND_URL } from "./config";

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
  async getProvinces(): Promise<Province[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/locations/provinces`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getProvinces từ Backend:", err);
      return [];
    }
  },

  /**
   * Lấy danh sách Xã/Phường theo mã Tỉnh/Thành phố từ Backend (Offline JSON v2)
   */
  async getWards(provinceCode: number): Promise<Ward[]> {
    try {
      const res = await fetch(
        `${BACKEND_URL}/locations/wards?provinceCode=${provinceCode}`,
        {
          cache: "no-store",
        }
      );
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getWards từ Backend:", err);
      return [];
    }
  },
};
