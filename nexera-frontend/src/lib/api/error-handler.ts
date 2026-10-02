import { ApiError } from '@/lib/api/errors';

/**
 * Xử lý lỗi API thống nhất — hiển thị toast phù hợp theo loại lỗi
 */
export function handleApiError(
  error: unknown,
  toast: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void }
) {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) {
      toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    } else if (error.isValidation) {
      const message = error.data?.message || 'Dữ liệu không hợp lệ.';
      toast.error(message);
    } else if (error.isNotFound) {
      toast.error('Không tìm thấy dữ liệu yêu cầu.');
    } else if (error.isForbidden) {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
    } else if (error.isServerError) {
      toast.error('Lỗi hệ thống. Vui lòng thử lại sau.');
    } else {
      toast.error(error.data?.message || error.message);
    }
  } else if (error instanceof Error) {
    toast.error(error.message || 'Đã xảy ra lỗi không xác định.');
  } else {
    toast.error('Không thể kết nối tới máy chủ.');
  }
}
