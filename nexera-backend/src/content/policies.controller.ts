import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { UpdatePolicyDto } from './content.dto';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async getActivePolicies() {
    return this.policiesService.getActivePolicies();
  }

  @Get('admin/business-info')
  async getBusinessInfo() {
    return this.policiesService.getBusinessInfo();
  }

  @Post('admin/business-info')
  async saveBusinessInfo(@Body() dto: any) {
    return this.policiesService.saveBusinessInfo(dto);
  }

  @Get('business-info')
  async getPublicBusinessInfo() {
    return this.policiesService.getBusinessInfo();
  }

  @Get('admin/list')
  async getAllPoliciesAdmin() {
    return this.policiesService.getAllPoliciesAdmin();
  }

  @Get('admin/:id/versions')
  async getPolicyVersions(@Param('id') id: string) {
    return this.policiesService.getPolicyVersions(id);
  }

  @Patch('admin/:id/toggle-status')
  async togglePolicyStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.policiesService.togglePolicyStatus(id, isActive);
  }

  @Post('admin/:id/publish-version')
  async publishNewVersion(
    @Param('id') id: string,
    @Body() body: { versionName: string; content: string },
  ) {
    return this.policiesService.publishNewVersion(id, body.versionName, body.content);
  }

  @Patch('admin/:id/activate-version/:versionId')
  async activateVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.policiesService.activateVersion(id, versionId);
  }

  @Get(':slug')
  async getPolicyBySlug(@Param('slug') slug: string) {
    return this.policiesService.getPolicyBySlug(slug);
  }

  @Put('admin/:id')
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policiesService.updatePolicy(id, dto);
  }
}
