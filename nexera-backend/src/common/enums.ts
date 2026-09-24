// ==============================================================================
// NEXERA SYSTEM ENUMS - TẬP TRUNG TOÀN BỘ ENUM CHO HỆ THỐNG
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. ĐƠN HÀNG & THANH TOÁN (ORDERS & PAYMENTS)
// ------------------------------------------------------------------------------

/** Trạng thái vận hành đơn hàng (Chuẩn 3PL) */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT', // Chờ thanh toán QR (tối đa 15p)
  CONFIRMED = 'CONFIRMED',             // Chờ soát đơn (Đã TT hoặc COD mới)
  PROCESSING = 'PROCESSING',           // Chờ gửi bưu cục / Đang đóng gói
  SHIPPED = 'SHIPPED',                 // Đã gửi bên thứ 3 (GHN, Viettel Post, ...)
  DELIVERED = 'DELIVERED',             // Đã giao thành công (COD tự động chuyển PAID)
  RETURNED = 'RETURNED',               // Hoàn hàng / Khách boom (Tự động hoàn kho)
  CANCELLED = 'CANCELLED',             // Đã hủy (Tự động hoàn kho)
}

/** Phương thức thanh toán */
export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',     // Chuyển khoản QR (PayOS VietQR)
  COD = 'COD',                         // Thu hộ tiền mặt khi giao hàng
}

/** Trạng thái dòng tiền của đơn */
export enum PaymentStatus {
  UNPAID = 'UNPAID',                   // Chưa thanh toán (Chờ QR hoặc Chờ COD)
  PAID = 'PAID',                       // Đã nhận tiền (PayOS webhook hoặc Bưu tá nộp COD)
  REFUNDED = 'REFUNDED',               // Đã hoàn tiền lại cho khách
}

/** Đối tượng thực hiện hủy đơn */
export enum OrderCancelledBy {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  SYSTEM = 'SYSTEM',
}

// ------------------------------------------------------------------------------
// 2. LIVE CHAT & HỘI THOẠI (CHAT & CRM)
// ------------------------------------------------------------------------------

/** Trạng thái phiên chat hỗ trợ */
export enum ConversationStatus {
  OPEN = 'OPEN',                       // Đang mở / Khách đang chat
  PENDING = 'PENDING',                 // Chờ nhân viên hoặc khách phản hồi
  RESOLVED = 'RESOLVED',               // Đã tư vấn xong
  CLOSED = 'CLOSED',                   // Đã đóng phiên
}

/** Loại người gửi tin nhắn */
export enum ChatSenderType {
  CUSTOMER = 'CUSTOMER',               // Khách hàng / Khách vãng lai
  ADMIN = 'ADMIN',                     // Nhân viên CSKH / Admin
  SYSTEM = 'SYSTEM',                   // Thông báo tự động
  AI = 'AI',                           // Trợ lý ảo AI (nếu kích hoạt)
}

// ------------------------------------------------------------------------------
// 3. KHÁCH HÀNG & PHÂN HẠNG CRM (CUSTOMERS & CRM)
// ------------------------------------------------------------------------------

/** Phân hạng khách hàng */
export enum CustomerTier {
  STANDARD = 'STANDARD',               // Khách tiêu chuẩn
  POTENTIAL = 'POTENTIAL',             // Khách tiềm năng (hỏi giá, quan tâm gói lớn)
  LOYAL = 'LOYAL',                     // Khách thân thiết (đã mua nhiều lần)
  VIP = 'VIP',                         // Khách VIP / Doanh nghiệp
}

/** Trạng thái tài khoản khách hàng */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',                   // Đang hoạt động
  INACTIVE = 'INACTIVE',               // Chưa kích hoạt email/sđt
  BLOCKED = 'BLOCKED',                 // Đã bị chặn / Boom hàng nhiều lần
}

// ------------------------------------------------------------------------------
// 4. SẢN PHẨM & KHO HÀNG (CATALOG & INVENTORY)
// ------------------------------------------------------------------------------

/** Phân loại hình thức sản phẩm */
export enum ProductType {
  EQUIPMENT = 'EQUIPMENT',             // Thiết bị đơn lẻ (Tấm pin, Biến tần, Dây cáp, ...)
  PACKAGE = 'PACKAGE',                 // Gói giải pháp trọn gói (Gói 5kW gia đình, Gói 100kW xưởng, ...)
}

/** Trạng thái sản phẩm trên website */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',                   // Đang hiển thị và kinh doanh
  INACTIVE = 'INACTIVE',               // Đã ẩn khỏi gian hàng
  DRAFT = 'DRAFT',                     // Bản nháp đang biên soạn
  OUT_OF_STOCK = 'OUT_OF_STOCK',       // Hết hàng tạm thời
}

/** Hãng vận chuyển 3PL phổ biến */
export enum ShippingCarrier {
  GHN = 'Giao Hàng Nhanh (GHN)',
  GHTK = 'Giao Hàng Tiết Kiệm (GHTK)',
  VIETTEL_POST = 'Viettel Post',
  JT_EXPRESS = 'J&T Express',
  VNPOST = 'VNPost (Bưu Điện)',
  OTHER = 'Khác',
}

// ------------------------------------------------------------------------------
// 5. NỘI DUNG & DỰ ÁN (CMS & CONTENT)
// ------------------------------------------------------------------------------

/** Trạng thái bài viết / tin tức */
export enum ArticleStatus {
  DRAFT = 'DRAFT',                     // Bản nháp
  PUBLISHED = 'PUBLISHED',             // Đã xuất bản
  ARCHIVED = 'ARCHIVED',               // Lưu trữ / Ẩn
}

/** Phân loại bài viết */
export enum ArticleType {
  NEWS = 'NEWS',                       // Tin tức ngành điện mặt trời
  GUIDE = 'GUIDE',                     // Cẩm nang kỹ thuật & hướng dẫn sử dụng
  PROMOTION = 'PROMOTION',             // Chương trình khuyến mãi & ưu đãi
}

/** Phân loại danh mục dự án lắp đặt */
export enum ProjectCategory {
  INDUSTRIAL = 'INDUSTRIAL',           // Điện mặt trời Công nghiệp / Nhà máy
  RESIDENTIAL = 'RESIDENTIAL',         // Hộ gia đình / Dân dụng
  AGRICULTURAL = 'AGRICULTURAL',       // Nông nghiệp công nghệ cao
  COMMERCIAL = 'COMMERCIAL',           // Tòa nhà thương mại / Khách sạn
}

/** Loại chính sách pháp lý / vận hành */
export enum PolicyType {
  WARRANTY = 'WARRANTY',               // Chính sách bảo hành
  RETURN_EXCHANGE = 'RETURN_EXCHANGE', // Chính sách đổi trả
  PRIVACY = 'PRIVACY',                 // Chính sách bảo mật
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE', // Điều khoản dịch vụ
  SHIPPING = 'SHIPPING',               // Chính sách vận chuyển & giao hàng
  PAYMENT = 'PAYMENT',                 // Quy định thanh toán
}

// ------------------------------------------------------------------------------
// 6. PHÂN QUYỀN & TÀI KHOẢN QUẢN TRỊ (RBAC)
// ------------------------------------------------------------------------------

/** Vai trò hệ thống mặc định */
export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',         // Toàn quyền quản trị hệ thống
  ADMIN = 'ADMIN',                     // Quản trị viên cửa hàng & khách hàng
  SALES = 'SALES',                     // Nhân viên kinh doanh & CSKH
}

/** Trạng thái tài khoản Admin */
export enum AdminAccountStatus {
  ACTIVE = 'ACTIVE',                   // Đang hoạt động
  INACTIVE = 'INACTIVE',               // Đã tạm khóa
}

// ------------------------------------------------------------------------------
// 7. NHẬT KÝ & GIÁM SÁT HOẠT ĐỘNG (AUDIT LOGS)
// ------------------------------------------------------------------------------

/** Mức độ cảnh báo của nhật ký */
export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/** Loại thực thể thao tác */
export enum ActivityEntityType {
  ORDERS = 'orders',
  PRODUCTS = 'products',
  CUSTOMERS = 'customers',
  CONVERSATIONS = 'conversations',
  ARTICLES = 'articles',
  PROJECTS = 'projects',
  CATEGORIES = 'categories',
  POLICIES = 'policies',
  ADMIN_ACCOUNTS = 'admin_accounts',
  ROLES = 'roles',
  SYSTEM = 'system',
}

/** Hành động nhật ký */
export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  UPDATE_ORDER_STATUS = 'UPDATE_ORDER_STATUS',
  UPDATE_RECIPIENT = 'UPDATE_RECIPIENT',
  UPDATE_SHIPPING = 'UPDATE_SHIPPING',
  SYNC_CUSTOMER = 'SYNC_CUSTOMER',
}
