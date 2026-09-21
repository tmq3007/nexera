import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { GetArticlesQueryDto, CreateArticleDto, UpdateArticleDto } from './content.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async getArticles(@Query() query: GetArticlesQueryDto) {
    return this.articlesService.getArticles(query);
  }

  @Get(':idOrSlug')
  async getArticleByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.articlesService.getArticleByIdOrSlug(idOrSlug);
  }

  @Post('admin')
  async createArticle(@Body() dto: CreateArticleDto) {
    return this.articlesService.createArticle(dto);
  }

  @Put('admin/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.updateArticle(id, dto);
  }

  @Delete('admin/:id')
  async deleteArticle(@Param('id') id: string) {
    return this.articlesService.deleteArticle(id);
  }
}
