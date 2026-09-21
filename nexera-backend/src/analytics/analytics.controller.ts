import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateActivityLogDto, QueryActivityLogsDto } from './analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard-overview')
  async getDashboardOverview() {
    return this.analyticsService.getDashboardOverview();
  }

  @Post('activity-logs')
  async logActivity(@Body() dto: CreateActivityLogDto) {
    return this.analyticsService.logActivity(dto);
  }

  @Get('activity-logs')
  async getActivityLogs(@Query() query: QueryActivityLogsDto) {
    return this.analyticsService.getActivityLogs(query);
  }
}
