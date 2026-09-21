import { IsString, IsOptional, IsBoolean } from 'class-validator';

// ===================== PROJECTS =====================
export class GetProjectsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  category: string; // 'INDUSTRIAL' | 'RESIDENTIAL' | 'AGRICULTURAL' | 'SOLAR'

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  completionDate?: string;
}

export class UpdateProjectDto extends CreateProjectDto {}

// ===================== ARTICLES =====================
export class GetArticlesQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;
}

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;
}

export class UpdateArticleDto extends CreateArticleDto {}

// ===================== POLICIES =====================
export class UpdatePolicyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
