/**
 * BẢNG CẤU HÌNH THÔNG BÁO VÀ BẢN DỊCH TIẾNG VIỆT (MESSAGES & LOG DICTIONARY)
 * Quản lý tập trung toàn bộ Log action, Entity label và Thông báo lỗi Toast.
 */

// 1. Bản dịch Các Hành Động Nhật Ký (Log Actions)
export const LOG_ACTIONS: Record<string, { label: string; description?: string }> = {
  // Sản phẩm
  CREATE_PRODUCT: { label: "Thêm sản phẩm mới" },
  UPDATE_PRODUCT: { label: "Cập nhật sản phẩm" },
  DELETE_PRODUCT: { label: "Xóa sản phẩm" },
  DELETE_PRODUCTS_BULK: { label: "Xóa hàng loạt sản phẩm" },
  TOGGLE_PRODUCT_ACTIVE: { label: "Thay đổi trạng thái ẩn/hiện sản phẩm" },
  TOGGLE_PRODUCTS_ACTIVE_BULK: { label: "Thay đổi trạng thái hàng loạt sản phẩm" },
  MOVE_PRODUCTS_CATEGORY_BULK: { label: "Chuyển danh mục hàng loạt sản phẩm" },

  // Danh mục
  CREATE_CATEGORY: { label: "Thêm danh mục mới" },
  UPDATE_CATEGORY: { label: "Cập nhật danh mục" },
  DELETE_CATEGORY: { label: "Xóa danh mục" },

  // Đơn hàng
  UPDATE_ORDER_STATUS: { label: "Cập nhật trạng thái đơn hàng" },
  UPDATE_ORDERS_STATUS_BULK: { label: "Cập nhật trạng thái nhiều đơn hàng" },
  DELETE_ORDER: { label: "Xóa đơn hàng" },
  DELETE_ORDERS_BULK: { label: "Xóa hàng loạt đơn hàng" },

  // Bài viết
  CREATE_ARTICLE: { label: "Thêm bài viết mới" },
  UPDATE_ARTICLE: { label: "Cập nhật bài viết" },
  DELETE_ARTICLE: { label: "Xóa bài viết" },

  // Dự án
  CREATE_PROJECT: { label: "Thêm dự án mới" },
  UPDATE_PROJECT: { label: "Cập nhật dự án" },
  DELETE_PROJECT: { label: "Xóa dự án" },

  // Khách hàng & Lead tư vấn
  UPDATE_LEAD_STATUS: { label: "Cập nhật trạng thái tư vấn" },
  UPDATE_LEADS_STATUS_BULK: { label: "Cập nhật trạng thái nhiều yêu cầu tư vấn" },
  DELETE_LEADS_BULK: { label: "Xóa hàng loạt yêu cầu tư vấn" },
  UPDATE_CUSTOMER: { label: "Cập nhật thông tin khách hàng" },
  DELETE_CUSTOMER: { label: "Xóa hồ sơ khách hàng" },

  // Phân quyền & Hệ thống
  CREATE_ROLE: { label: "Tạo vai trò phân quyền mới" },
  UPDATE_ROLE: { label: "Cập nhật vai trò phân quyền" },
  DELETE_ROLE: { label: "Xóa vai trò phân quyền" },
  CREATE_ACCOUNT: { label: "Thêm tài khoản quản trị" },
  UPDATE_ACCOUNT: { label: "Cập nhật tài khoản quản trị" },
  DELETE_ACCOUNT: { label: "Xóa tài khoản quản trị" },
  TOGGLE_ACCOUNT_ACTIVE: { label: "Thay đổi trạng thái tài khoản" },
};

// 2. Bản dịch Loại Đối Tượng (Log Entities)
export const LOG_ENTITIES: Record<string, string> = {
  products: "Sản phẩm",
  categories: "Danh mục sản phẩm",
  orders: "Đơn hàng",
  articles: "Bài viết & Tin tức",
  projects: "Dự án tiêu biểu",
  leads: "Khách hàng tư vấn",
  customers: "Hồ sơ Khách hàng",
  roles: "Vai trò & Phân quyền",
  accounts: "Tài khoản Quản trị",
  system: "Hệ thống",
};

// 3. Bản dịch Mã Lỗi Supabase & Hệ Thống sang Tiếng Việt
export const ERROR_TRANSLATIONS: Record<string, string> = {
  "23505": "Dữ liệu đã tồn tại trong hệ thống (trùng lặp mã, tên hoặc email).",
  "23503": "Không thể xóa hoặc thay đổi vì dữ liệu đang được sử dụng ở danh mục khác.",
  "42501": "Bạn không có quyền thực hiện thao tác này.",
  "22P02": "Định dạng dữ liệu đầu vào không hợp lệ.",
  "PGRST116": "Không tìm thấy dữ liệu yêu cầu.",
  "JWT expired": "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
  "Invalid login credentials": "Tên đăng nhập hoặc mật khẩu không chính xác.",
  "Email not confirmed": "Email chưa được xác thực. Vui lòng kiểm tra hộp thư.",
  "User already registered": "Email này đã được đăng ký tài khoản.",
};

/**
 * Lấy nhãn tiếng Việt cho Log Action
 */
export function getLogActionLabel(actionKey: string): string {
  return LOG_ACTIONS[actionKey]?.label || actionKey;
}

/**
 * Lấy nhãn tiếng Việt cho Log Entity
 */
export function getEntityLabel(entityKey: string): string {
  return LOG_ENTITIES[entityKey] || entityKey;
}

/**
 * Chuyển đổi mã lỗi Supabase / JS Error sang Thông báo Tiếng Việt thân thiện
 */
export function formatErrorMessage(error: any, fallbackMessage: string = "Đã có lỗi xảy ra. Vui lòng thử lại!"): string {
  if (!error) return fallbackMessage;

  const code = error.code || "";
  const message = error.message || "";

  // Tra cứu theo mã lỗi SQL Postgres
  if (code && ERROR_TRANSLATIONS[code]) {
    return ERROR_TRANSLATIONS[code];
  }

  // Tra cứu theo từ khóa trong message
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.includes(key)) {
      return translation;
    }
  }

  // Trả về message nguyên bản nếu là Tiếng Việt, ngược lại trả về fallback
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(message)) {
    return message;
  }

  return fallbackMessage;
}
