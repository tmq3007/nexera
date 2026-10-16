import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  GetProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  BulkUpdateProductsDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
  CreateProductTypeDto,
  UpdateProductTypeDto,
} from './products.dto';
import { BrandsService } from './brands.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly brandsService: BrandsService,
  ) {}

  // ===================== DANH MỤC (CATEGORIES) =====================

  @Get('categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get('categories/:idOrSlug')
  async getCategoryByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.getCategoryByIdOrSlug(idOrSlug);
  }

  @Post('admin/categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Put('admin/categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(id, dto);
  }

  @Delete('admin/categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.productsService.deleteCategory(id);
  }

  // ===================== THƯƠNG HIỆU (BRANDS) =====================

  @Get('brands')
  async getBrands() {
    return this.brandsService.getBrands();
  }

  @Post('admin/brands')
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.brandsService.createBrand(dto);
  }

  @Put('admin/brands/:id')
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.updateBrand(id, dto);
  }

  @Delete('admin/brands/:id')
  async deleteBrand(@Param('id') id: string) {
    return this.brandsService.deleteBrand(id);
  }

  // ===================== LOẠI SẢN PHẨM (theo Thương hiệu) =====================

  @Get('types')
  async getProductTypes(@Query('brand_id') brandId?: string) {
    return this.brandsService.getProductTypes(brandId || undefined);
  }

  @Post('admin/types')
  async createProductType(@Body() dto: CreateProductTypeDto) {
    return this.brandsService.createProductType(dto);
  }

  @Put('admin/types/:id')
  async updateProductType(@Param('id') id: string, @Body() dto: UpdateProductTypeDto) {
    return this.brandsService.updateProductType(id, dto);
  }

  @Delete('admin/types/:id')
  async deleteProductType(@Param('id') id: string) {
    return this.brandsService.deleteProductType(id);
  }

  // ===================== SẢN PHẨM (PRODUCTS) =====================

  @Get('bestsellers')
  async getBestsellers(@Query('limit') limit?: string) {
    return this.productsService.getBestsellers(limit ? parseInt(limit, 10) : 8);
  }

  @Get('detail/:slugOrId')
  async getProductDetail(@Param('slugOrId') slugOrId: string) {
    return this.productsService.getProductDetail(slugOrId);
  }

  @Get()
  async getProducts(@Query() query: GetProductsQueryDto) {
    return this.productsService.getProducts(query);
  }

  @Post('admin')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put('admin/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete('admin/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  @Patch('admin/bulk')
  async bulkUpdateProducts(@Body() dto: BulkUpdateProductsDto) {
    return this.productsService.bulkUpdateProducts(dto);
  }
}
