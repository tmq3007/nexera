// ==============================================================================
// NEXERA SYSTEM ENUMS - FRONTEND ENUMS TẬP TRUNG
// Đồng bộ 100% với Backend & Supabase Database
// Sử dụng chuẩn "as const + Union Type" tối ưu cho TypeScript và Next.js
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. ĐƠN HÀNG & THANH TOÁN (ORDERS & PAYMENTS)
// ------------------------------------------------------------------------------

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT', // Chờ thanh toán QR (tối đa 15p)
  CONFIRMED: 'CONFIRMED',             // Chờ soát đơn (Đã TT hoặc COD mới)
  PROCESSING: 'PROCESSING',           // Chờ gửi bưu cục / Đang đóng gói
  SHIPPED: 'SHIPPED',                 // Đã gửi bên thứ 3 (GHN, Viettel Post, ...)
  DELIVERED: 'DELIVERED',             // Đã giao thành công
  RETURNED: 'RETURNED',               // Hoàn hàng / Khách boom
  CANCELLED: 'CANCELLED',             // Đã hủy
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  BANK_TRANSFER: 'BANK_TRANSFER',     // Chuyển khoản QR (PayOS VietQR)
  COD: 'COD',                         // Thu hộ tiền mặt khi giao hàng
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: 'UNPAID',                   // Chưa thanh toán
  PAID: 'PAID',                       // Đã nhận tiền
  REFUNDED: 'REFUNDED',               // Đã hoàn tiền
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const OrderCancelledBy = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  SYSTEM: 'SYSTEM',
} as const;
export type OrderCancelledBy = (typeof OrderCancelledBy)[keyof typeof OrderCancelledBy];

// ------------------------------------------------------------------------------
// 2. LIVE CHAT & HỘI THOẠI (CHAT & CRM)
// ------------------------------------------------------------------------------

export const ConversationStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const ChatSenderType = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM',
  AI: 'AI',
} as const;
export type ChatSenderType = (typeof ChatSenderType)[keyof typeof ChatSenderType];

// ------------------------------------------------------------------------------
// 3. KHÁCH HÀNG & CRM (CUSTOMERS & CRM)
// ------------------------------------------------------------------------------

export const CustomerTier = {
  STANDARD: 'STANDARD',
  POTENTIAL: 'POTENTIAL',
  LOYAL: 'LOYAL',
  VIP: 'VIP',
} as const;
export type CustomerTier = (typeof CustomerTier)[keyof typeof CustomerTier];

export const CustomerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

// ------------------------------------------------------------------------------
// 4. SẢN PHẨM & KHO HÀNG (CATALOG & INVENTORY)
// ------------------------------------------------------------------------------

export const ProductType = {
  EQUIPMENT: 'EQUIPMENT',             // Thiết bị đơn lẻ
  PACKAGE: 'PACKAGE',                 // Gói giải pháp trọn gói
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DRAFT: 'DRAFT',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ShippingCarrier = {
  GHN: 'Giao Hàng Nhanh (GHN)',
  GHTK: 'Giao Hàng Tiết Kiệm (GHTK)',
  VIETTEL_POST: 'Viettel Post',
  JT_EXPRESS: 'J&T Express',
  VNPOST: 'VNPost (Bưu Điện)',
  OTHER: 'Khác',
} as const;
export type ShippingCarrier = (typeof ShippingCarrier)[keyof typeof ShippingCarrier];

// ------------------------------------------------------------------------------
// 5. NỘI DUNG & DỰ ÁN (CMS & CONTENT)
// ------------------------------------------------------------------------------

export const ArticleStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export const ArticleType = {
  NEWS: 'NEWS',
  GUIDE: 'GUIDE',
  PROMOTION: 'PROMOTION',
} as const;
export type ArticleType = (typeof ArticleType)[keyof typeof ArticleType];

export const ProjectCategory = {
  INDUSTRIAL: 'INDUSTRIAL',
  RESIDENTIAL: 'RESIDENTIAL',
  AGRICULTURAL: 'AGRICULTURAL',
  COMMERCIAL: 'COMMERCIAL',
} as const;
export type ProjectCategory = (typeof ProjectCategory)[keyof typeof ProjectCategory];

export const PolicyType = {
  WARRANTY: 'WARRANTY',
  RETURN_EXCHANGE: 'RETURN_EXCHANGE',
  PRIVACY: 'PRIVACY',
  TERMS_OF_SERVICE: 'TERMS_OF_SERVICE',
  SHIPPING: 'SHIPPING',
  PAYMENT: 'PAYMENT',
} as const;
export type PolicyType = (typeof PolicyType)[keyof typeof PolicyType];

// ------------------------------------------------------------------------------
// 6. PHÂN QUYỀN (RBAC)
// ------------------------------------------------------------------------------

export const SystemRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SALES: 'SALES',
} as const;
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

// ------------------------------------------------------------------------------
// 7. NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS)
// ------------------------------------------------------------------------------

export const LogSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;
export type LogSeverity = (typeof LogSeverity)[keyof typeof LogSeverity];

export const ActivityEntityType = {
  ORDERS: 'orders',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  CONVERSATIONS: 'conversations',
  ARTICLES: 'articles',
  PROJECTS: 'projects',
  CATEGORIES: 'categories',
  POLICIES: 'policies',
  ADMIN_ACCOUNTS: 'admin_accounts',
  ROLES: 'roles',
  SYSTEM: 'system',
} as const;
export type ActivityEntityType = (typeof ActivityEntityType)[keyof typeof ActivityEntityType];
