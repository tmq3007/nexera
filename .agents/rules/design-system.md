# Nexera Design System — Responsive, Màu sắc, Button & Table

Quy chuẩn bắt buộc cho mọi file `.tsx` trong `nexera-frontend`.
Mọi component mới hoặc sửa đổi PHẢI tuân thủ tài liệu này.

---

## 1. Responsive & Breakpoints

### 1.1 Breakpoints chuẩn (Tailwind CSS v4)

| Token | Min-width | Thiết bị           | Ví dụ sử dụng                      |
| :---- | :-------- | :------------------ | :----------------------------------- |
| _(mặc định)_ | 0px | Mobile dọc (≤ 639px) | Layout 1 cột, font nhỏ, touch-first |
| `sm:`  | 640px    | Mobile ngang / Tablet nhỏ | 2 cột grid, mở rộng padding          |
| `md:`  | 768px    | Tablet              | Admin Sidebar hiện, 2-3 cột grid    |
| `lg:`  | 1024px   | Laptop              | Sidebar sticky, 3-4 cột grid        |
| `xl:`  | 1280px   | Desktop             | Container max-width, 4+ cột         |

### 1.2 Nguyên tắc bắt buộc

1. **Mobile-first**: Luôn viết class mặc định cho mobile, dùng `md:`, `lg:` để mở rộng.
2. **Touch Target tối thiểu**: Mọi nút/icon interactive trên mobile phải có vùng chạm ≥ `44px × 44px` (dùng `min-w-11 min-h-11` hoặc padding đủ lớn).
3. **Container**: Luôn dùng `container mx-auto px-4` cho Storefront.
4. **Không tràn ngang**: Cấm element nào gây horizontal scroll trên mobile. Luôn test ở `375px`.

### 1.3 Grid Storefront

```
/* Card sản phẩm, tin tức, dự án */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6

/* Card 4 cột (tin tức trang chủ) */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6

/* Layout sidebar + content (trang sản phẩm) */
grid grid-cols-1 lg:grid-cols-12 gap-8
  /* Sidebar */ lg:col-span-3
  /* Content */ lg:col-span-9
```

### 1.4 Admin Layout

```
/* Wrapper chính */
flex h-screen bg-gray-50 overflow-hidden

/* Sidebar: ẨN trên mobile, hiện từ md trở lên */
/* Mobile (< md): hidden mặc định, toggle qua Hamburger → fixed overlay z-50 */
/* Desktop (≥ md): static, có nút collapse thu gọn icon-only */

/* Main content */
flex-1 flex flex-col overflow-hidden
  /* Header */  shrink-0
  /* Content */ flex-1 overflow-y-auto p-4 md:p-5
```

### 1.5 Admin Table Responsive

```
/* Wrapper table phải luôn có overflow-x-auto */
<div className="overflow-x-auto">
  <table className="w-full min-w-[700px] text-left border-collapse">
    ...
  </table>
</div>
/* min-w-[700px] đảm bảo table không bị ép co trên mobile, cho phép cuộn ngang */
```

### 1.6 Bộ lọc sản phẩm Storefront (Mobile)

- **Desktop (≥ lg)**: Sidebar cố định bên trái (`lg:sticky lg:top-24`).
- **Mobile (< lg)**: Bộ lọc phải ẩn mặc định, hiển thị qua nút "Bộ lọc" mở Drawer/Sheet hoặc Accordion collapsible để người dùng nhìn thấy sản phẩm ngay.

### 1.7 Floating Contact (Mobile)

- Thu nhỏ kích thước nút từ `w-14 h-14` → `w-11 h-11 sm:w-12 sm:h-12` trên mobile.
- Giữ khoảng cách với cạnh phải: `right-4 sm:right-6`.

---

## 2. Bảng Màu (Color Palette)

### 2.1 Màu nhận diện thương hiệu (CSS Variables)

| Tên            | CSS Variable       | Hex       | Dùng cho                                           |
| :------------- | :----------------- | :-------- | :------------------------------------------------- |
| **Background** | `var(--background)` | `#ffffff` | Nền trang chính                                    |
| **Foreground** | `var(--foreground)` | `#13426E` | Văn bản heading, text chính, footer bg             |
| **Primary**    | `var(--primary)`    | `#80BF49` | Nút CTA, badge, accent, highlight giá              |
| **Primary Light** | `var(--primary-light)` | `#9AD166` | Hover state cho Primary                        |
| **Accent**     | `var(--accent)`     | `#13426E` | Đồng nghĩa Foreground, dùng cho dark backgrounds  |
| **Surface**    | `var(--surface)`    | `#F0F7FB` | Nền section xen kẽ, card background                |
| **Border**     | `var(--border)`     | `#D4E6F1` | Đường viền card, divider                           |

### 2.2 Quy tắc sử dụng màu

- **KHÔNG dùng `#000000` (đen thuần)** cho text. Dùng `text-[#13426E]` hoặc `text-gray-900`.
- **KHÔNG dùng dark mode**. Toàn bộ website chỉ sáng (`color-scheme: only light`).
- **Header/Footer**: Nền `#13426E`, text trắng, accent `#80BF49`.
- **Storefront section xen kẽ**: Trắng (`bg-white`) ↔ Xanh nhạt (`bg-[#F0F7FB]`).

### 2.3 Màu trạng thái (Status Colors)

Dùng cho badge, text trạng thái trong Admin và Storefront:

| Trạng thái | Text color         | Background (pill)    | Dùng cho                          |
| :--------- | :----------------- | :------------------- | :-------------------------------- |
| **Thành công** | `text-emerald-600` | `bg-emerald-50`  | Hoàn thành, Còn hàng, Active     |
| **Cảnh báo**   | `text-amber-600`  | `bg-amber-50`    | Chờ xử lý, Sắp hết hàng         |
| **Nguy hiểm**  | `text-rose-600`   | `bg-rose-50`     | Hết hàng, Đã hủy, Xóa, Lỗi     |
| **Thông tin**   | `text-blue-600`   | `bg-blue-50`     | Đã thanh toán, Thông tin         |
| **Đặc biệt**   | `text-purple-600` | `bg-purple-50`   | Đang vận chuyển, VIP             |

> **Lưu ý (Admin)**: Theo rule `admin-clean-ui.md`, trạng thái trong Admin hiển thị dạng **text thuần** với màu sắc, KHÔNG dùng pill nền nặng nề. Chỉ Storefront mới dùng pill nhỏ (`text-[10px] px-2 py-0.5 rounded-full`).

---

## 3. Button (Nút bấm)

### 3.1 Bốn biến thể (Variants)

#### A. Primary — Hành động chính
```
bg-[#13426E] hover:bg-[#1e5a92] text-white font-semibold rounded-xl
shadow-sm transition-all
```
**Dùng cho:** Đăng nhập, Lưu form, Xác nhận thanh toán, "Xem thêm".

#### B. CTA / Success — Hành động nổi bật
```
bg-[#80BF49] hover:bg-[#6daa37] text-white font-bold rounded-xl
shadow-sm transition-all
```
**Dùng cho:** "Nhận tư vấn ngay", "Thêm sản phẩm", "Mua ngay", CTA Hero.

#### C. Outline — Hành động phụ
```
border border-[#13426E] bg-white text-[#13426E] font-medium rounded-lg
hover:bg-gray-50 shadow-sm transition-colors
```
**Dùng cho:** "Thêm vào giỏ", "Hủy", bộ lọc toggle, nút phụ bên cạnh nút chính.

#### D. Ghost / Icon — Nút icon thao tác
```
p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100
rounded-lg transition-colors
```
**Dùng cho:** Icon Xem (Eye), Sửa (Edit), Xóa (Trash2) trong bảng Admin.

#### E. Danger — Hành động nguy hiểm
```
bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg
transition-colors
```
**Dùng cho:** Xác nhận xóa trong ConfirmModal, Bulk Delete.

### 3.2 Ba kích thước

| Size | Class                               | Dùng cho                           |
| :--- | :----------------------------------- | :--------------------------------- |
| `sm` | `px-3 py-1.5 text-xs rounded-lg`    | Trong bảng, toolbar, bulk action   |
| `md` | `px-4 py-2.5 text-sm rounded-xl`    | Form, Modal, filter, pagination    |
| `lg` | `px-6 py-3 text-base rounded-xl`    | CTA Hero, Thanh toán, trang chủ    |

### 3.3 Quy tắc bắt buộc

- Mọi button PHẢI có `transition-colors` hoặc `transition-all`.
- Button loading: Thêm `disabled:opacity-50` + icon `<Loader2 className="w-4 h-4 animate-spin" />`.
- Icon trong button: Đặt trước text, kích thước `w-4 h-4` (sm) hoặc `w-5 h-5` (lg).
- **Đừng tạo class button riêng lẻ.** Luôn tái sử dụng đúng 5 variant trên.

---

## 4. Table (Bảng dữ liệu Admin)

### 4.1 Cấu trúc chuẩn

```tsx
{/* Container bọc ngoài */}
<div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden
                flex flex-col min-h-0 flex-1 shadow-2xs">

  {/* Scrollable Area */}
  <div className="flex-1 overflow-auto">
    <table className="w-full text-left border-collapse">

      {/* Header */}
      <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
        <tr className="border-b border-gray-200/80 text-[11px] font-bold
                       text-gray-500 uppercase tracking-wider">
          <th className="px-3 py-2.5">...</th>
        </tr>
      </thead>

      {/* Body */}
      <tbody className="divide-y divide-gray-100">
        <tr className="hover:bg-slate-50/70 transition-colors">
          <td className="px-3 py-2">...</td>
        </tr>
      </tbody>

    </table>
  </div>

  {/* Footer: Pagination */}
  <AdminPagination ... />
</div>
```

### 4.2 Quy tắc bắt buộc

1. **Wrapper**: Luôn bọc `<table>` trong `overflow-auto` container.
2. **Sticky Header**: `thead` luôn `sticky top-0` với `bg-gray-50/90 backdrop-blur-xs`.
3. **Header text**: `text-[11px] font-bold text-gray-500 uppercase tracking-wider`.
4. **Cell padding**: Compact `px-3 py-2` | Normal `px-3 py-3`. Dùng biến `density`.
5. **Hover row**: `hover:bg-slate-50/70 transition-colors`.
6. **Divider**: `<tbody className="divide-y divide-gray-100">`.
7. **Cột Checkbox**: Luôn ở cột đầu tiên, `w-10 text-center`.
8. **Cột Thao tác**: Luôn ở cột cuối, `w-24 text-center`. Gộp icon Xem/Sửa/Xóa trong `flex items-center justify-center gap-1.5`.
9. **Icon thao tác**: Kích thước `w-3.5 h-3.5`. Hover: `text-blue-600` (Xem), `text-amber-600` (Sửa), `text-rose-600` (Xóa).
10. **Empty state**: `text-center py-16 text-gray-400 text-sm` với optional CTA link.
11. **Pagination Footer**: Sử dụng component `<AdminPagination>` thống nhất cho tất cả.

### 4.3 Components dùng kèm bảng (Đã có sẵn)

| Component | File | Chức năng |
| :-------- | :--- | :-------- |
| `AdminTableToolbar` | `components/admin/AdminTableToolbar.tsx` | Thanh tab trạng thái + Bộ lọc + Mật độ + Nút thêm mới |
| `AdminFilterBar` | `components/admin/AdminFilterBar.tsx` | Dải bộ lọc nâng cao (select, date, price_range, sort) |
| `AdminBulkActionBar` | `components/admin/AdminBulkActionBar.tsx` | Thanh thao tác hàng loạt khi chọn nhiều dòng |
| `AdminPagination` | `components/admin/AdminPagination.tsx` | Phân trang: chọn số dòng, prev/next, hiển thị "X / Y" |

> **Luật**: Khi tạo trang Admin mới có danh sách, PHẢI sử dụng lại 4 component trên thay vì code lại từ đầu.

---

## 5. Shared UI Components (Đã có sẵn)

| Component | File | Dùng cho |
| :-------- | :--- | :------- |
| `Modal` | `components/ui/Modal.tsx` | Modal chung (`maxWidth` tuỳ chỉnh, header + scrollable body) |
| `ConfirmModal` | `components/ui/ConfirmModal.tsx` | Xác nhận xóa (icon AlertTriangle + nút Danger) |
| `ImageUpload` | `components/ui/ImageUpload.tsx` | Upload ảnh đơn (Supabase Storage) |
| `MultiImageUpload` | `components/ui/MultiImageUpload.tsx` | Upload gallery nhiều ảnh |
| `SpecificationsEditor` | `components/ui/SpecificationsEditor.tsx` | Editor thông số kỹ thuật key-value |

> **Luật**: Khi cần Modal/Upload, PHẢI import từ `@/components/ui/`. Không tạo Modal riêng lẻ.

---

## 6. Typography

| Element | Font Family | Class ví dụ |
| :------ | :---------- | :---------- |
| Heading (h1-h6) | Montserrat (`var(--font-heading)`) | Tự động qua `globals.css` |
| Body text | Inter (`var(--font-sans)`) | Tự động qua `globals.css` |
| Monospace (mã đơn, slug) | `font-mono` | `text-[11px] text-gray-400 font-mono` |

### Font sizes tham khảo

| Ngữ cảnh | Class |
| :-------- | :---- |
| Page title (Storefront) | `text-3xl md:text-4xl font-bold` |
| Section heading | `text-2xl md:text-3xl font-bold` |
| Card title | `text-base font-semibold` |
| Body text | `text-sm` hoặc `text-base` |
| Table header | `text-[11px] uppercase tracking-wider` |
| Table cell | `text-xs md:text-sm` |
| Caption / metadata | `text-[11px] text-gray-400` |

---

## 7. Spacing & Radius

| Ngữ cảnh | Border Radius | Padding/Gap |
| :-------- | :------------ | :---------- |
| Card (Storefront) | `rounded-xl` (12px) | `p-5` |
| Card (Admin) | `rounded-2xl` (16px) | `p-4 md:p-5` |
| Button | `rounded-xl` (12px) | Theo size (sm/md/lg) |
| Input/Select | `rounded-lg` (8px) | `px-4 py-2.5` |
| Modal | `rounded-xl` (12px) | Header `px-6 py-4`, Body `p-6` |
| Badge/Pill | `rounded-full` | `px-2 py-0.5` |
| Table container | `rounded-2xl` (16px) | — |

---

## 8. Quy tắc Icon (Lucide React)

- **Icon library**: Chỉ dùng `lucide-react`. KHÔNG import icon từ thư viện khác.
- **Size chuẩn**: `w-4 h-4` (mặc định), `w-3.5 h-3.5` (trong bảng), `w-5 h-5` (header/CTA).
- **Tuân thủ** rule `admin-clean-ui.md`: Không gắn icon trang trí trước label text.
