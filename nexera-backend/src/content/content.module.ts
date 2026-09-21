import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ProjectsController, ArticlesController, PoliciesController],
  providers: [ProjectsService, ArticlesService, PoliciesService],
  exports: [ProjectsService, ArticlesService, PoliciesService],
})
export class ContentModule {}
