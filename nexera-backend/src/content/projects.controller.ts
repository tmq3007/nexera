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
import { ProjectsService } from './projects.service';
import { GetProjectsQueryDto, CreateProjectDto, UpdateProjectDto } from './content.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects(@Query() query: GetProjectsQueryDto) {
    return this.projectsService.getProjects(query);
  }

  @Get(':idOrSlug')
  async getProjectByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.projectsService.getProjectByIdOrSlug(idOrSlug);
  }

  @Post('admin')
  async createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Put('admin/:id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(id, dto);
  }

  @Delete('admin/:id')
  async deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }
}
