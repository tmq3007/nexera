import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'products';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Tự động tạo bucket nếu chưa tồn tại khi backend khởi động
   */
  async onModuleInit() {
    const supabase = this.supabaseService.getClient();

    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === BUCKET_NAME);

    if (!exists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });

      if (error) {
        this.logger.error(`Không thể tạo bucket "${BUCKET_NAME}":`, error.message);
      } else {
        this.logger.log(`Đã tạo Storage bucket "${BUCKET_NAME}" thành công.`);
      }
    } else {
      this.logger.log(`Storage bucket "${BUCKET_NAME}" đã tồn tại.`);
    }
  }

  /**
   * Upload 1 file lên Supabase Storage
   * @returns Public URL của ảnh đã upload
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    this.validateFile(file);

    const supabase = this.supabaseService.getClient();
    const ext = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error('Lỗi upload file lên Supabase Storage:', error);
      throw new BadRequestException(`Upload thất bại: ${error.message}`);
    }

    // Lấy public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    this.logger.log(`Upload thành công: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  }

  /**
   * Upload nhiều file song song
   * @returns Mảng public URL
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Xóa file khỏi Supabase Storage theo public URL
   */
  async deleteFile(publicUrl: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    // Parse path từ public URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/products/folder/file.jpg
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const markerIndex = publicUrl.indexOf(marker);

    if (markerIndex === -1) {
      this.logger.warn(`URL không hợp lệ cho bucket "${BUCKET_NAME}": ${publicUrl}`);
      return false;
    }

    const filePath = publicUrl.substring(markerIndex + marker.length);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      this.logger.error(`Lỗi xóa file "${filePath}":`, error);
      return false;
    }

    this.logger.log(`Đã xóa file: ${filePath}`);
    return true;
  }

  /**
   * Validate file trước khi upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Không tìm thấy file.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Loại file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Kích thước file vượt quá giới hạn (${(file.size / 1024 / 1024).toFixed(1)}MB > 5MB).`,
      );
    }
  }
}
