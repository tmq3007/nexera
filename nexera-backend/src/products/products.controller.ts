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
} from './products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
