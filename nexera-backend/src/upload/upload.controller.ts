import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /upload
   * Upload 1 file ảnh
   * Body: multipart/form-data { file, folder? }
   * Response: { url: string }
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload.');
    }

    const url = await this.uploadService.uploadFile(
      file,
      folder || 'general',
    );

    return { url };
  }

  /**
   * POST /upload/multiple
   * Upload nhiều file ảnh (tối đa 10)
   * Body: multipart/form-data { files[], folder? }
   * Response: { urls: string[] }
   */
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 file để upload.');
    }

    const urls = await this.uploadService.uploadMultiple(
      files,
      folder || 'general',
    );

    return { urls };
  }

  /**
   * DELETE /upload
   * Xóa file theo public URL
   * Body: { url: string }
   */
  @Delete()
  async deleteFile(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('Thiếu URL file cần xóa.');
    }

    const success = await this.uploadService.deleteFile(url);
    return { success };
  }
}
