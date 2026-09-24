import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  @Get('wards')
  getWards(
    @Query('provinceCode') provinceCodeStr?: string,
    @Query('districtCode') districtCodeStr?: string
  ) {
    const codeStr = provinceCodeStr || districtCodeStr;
    if (!codeStr) {
      throw new BadRequestException('Tham số provinceCode là bắt buộc.');
    }
    const code = parseInt(codeStr, 10);
    if (isNaN(code)) {
      throw new BadRequestException('Mã không hợp lệ.');
    }
    return this.locationsService.getWards(code);
  }

  @Get('districts')
  getDistricts(@Query('provinceCode') provinceCodeStr?: string) {
    if (!provinceCodeStr) {
      return [];
    }
    const provinceCode = parseInt(provinceCodeStr, 10);
    if (isNaN(provinceCode)) {
      return [];
    }
    return this.locationsService.getDistricts(provinceCode);
  }
}
