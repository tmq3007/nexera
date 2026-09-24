# Kế hoạch Chuẩn hóa Quy trình Thanh toán & Quản trị Đơn hàng Nexera (Mô hình Vận hành Thống nhất 3PL)

Tài liệu này chuẩn hóa quy trình dựa trên nguyên lý cốt lõi của thương mại điện tử:
> **Luồng vận chuyển và xử lý đơn hàng là ĐỒNG NHẤT 100% giữa Chuyển khoản và COD**: Đều do công ty soát đơn, tự đóng gói và bàn giao cho Đơn vị vận chuyển thứ 3 (3PL: GHN, Viettel Post, GHTK...).
>
> **Điểm khác biệt DUY NHẤT giữa 2 phương thức là Thời điểm nhận tiền**:
> - **Chuyển khoản (VietQR PayOS)**: Tiền vào tài khoản công ty **ngay lập tức** tại lúc đặt hàng (`PAID` trước khi gửi).
> - **COD (Thanh toán khi nhận)**: Tiền **chưa nhận** lúc đặt hàng (`UNPAID`), bưu cục sẽ thu hộ tiền mặt khi giao hàng và chuyển về tài khoản công ty sau.

---

## 1. Kiến trúc Hai Trục Độc lập (Two-Axis Order Model)

Hệ thống quản lý đơn hàng chuẩn hóa sẽ tách bạch rõ ràng giữa **Trục Vận hành (Fulfillment)** và **Trục Dòng tiền (Payment)**:

- **Trục Vận hành (Kho & 3PL)**: 
  1. `CONFIRMED`: Soát đơn hàng (Admin duyệt thông tin SĐT, địa chỉ, hàng tồn).
  2. `PROCESSING`: Đang đóng gói (Hàng **chưa gửi** bưu cục).
  3. `SHIPPED`: Đã gửi bên thứ 3 (Gắn Hãng vận chuyển & Mã vận đơn).
  4. `DELIVERED`: Bưu cục báo phát thành công (hoặc `RETURNED` nếu boom hàng hoàn về kho).

- **Trục Dòng tiền (Thanh toán)**:
  - **Chuyển khoản (VietQR PayOS)**: Tiền vào tài khoản trước ➔ `payment_status: PAID` ngay tại cổng thanh toán. Đơn đủ tiền mới chuyển kho đóng gói.
  - **COD (Thu hộ)**: Khi đặt mang trạng thái `payment_status: UNPAID`. Kho dán tem ghi rõ "Thu hộ COD: xxx đ". Bưu cục thu tiền mặt và đối soát xong mới thành `PAID`.

---

## 2. Bảng Ma trận Trạng thái Đơn hàng (Unified Order Matrix)

| Trạng thái Đơn hàng (`status`) | Ý nghĩa Vận hành (Kho & 3PL) | Trạng thái Tiền: Chuyển khoản | Trạng thái Tiền: COD | Hành động của Admin / Kho |
| :--- | :--- | :--- | :--- | :--- |
| **`PENDING_PAYMENT`** | Chờ khách quét mã QR VietQR (tối đa 15p) | `UNPAID` (Chờ thanh toán) | *Không áp dụng* | Khách đang thanh toán trên web |
| **`CONFIRMED`** | **Chờ soát đơn**: Đơn hợp lệ, chuẩn bị đóng hàng | `PAID` (Đã nhận tiền) | `UNPAID` (Chưa thu) | Admin soát địa chỉ, SĐT, sửa nếu cần ➔ Bấm **"Duyệt đóng gói"** |
| **`PROCESSING`** | **Chưa gửi bưu cục**: Kho đang lấy hàng, đóng thùng | `PAID` (Đã nhận tiền) | `UNPAID` (Chưa thu) | Kho đóng gói xong ➔ Bàn giao cho bưu tá 3PL |
| **`SHIPPED`** | **Đã gửi bên thứ 3**: Hàng đang trên xe bưu cục | `PAID` (Đã nhận tiền) | `UNPAID` (Bưu cục đang thu hộ) | Gắn **Mã vận đơn** & theo dõi link tra cứu của hãng |
| **`DELIVERED`** | **Bưu cục báo phát thành công** | `PAID` (Đã nhận tiền) | `PAID` (Bưu cục đã thu tiền) | Đơn hoàn tất tốt đẹp |
| **`RETURNED`** | **Boom hàng / Bưu cục chuyển hoàn kiện về** | Cần đối soát hoàn tiền (nếu có) | `UNPAID` (Không thu được tiền) | Kho nhận lại kiện hàng ➔ Bấm hoàn tồn kho |
| **`CANCELLED`** | **Hủy đơn** (Khách hủy, sai SĐT, hết hàng) | Hoàn tiền lại cho khách (nếu CK) | Hủy bình thường | Tự động hoàn lại tồn kho nếu đã giữ hàng |

---

## 3. Thiết kế Giao diện Admin: Tinh gọn & Trực quan

Giao diện Admin [OrderManager.tsx](file:///d:/Document/_Projects/Nexera/nexera-frontend/src/components/admin/OrderManager.tsx) được thiết kế xoay quanh đúng 2 câu hỏi nghiệp vụ:
1. **"Đơn này tiền vào chưa?"** (Đã thanh toán trước hay Thu hộ COD).
2. **"Hàng đã gửi cho bên thứ 3 chưa?"** (Chờ soát ➔ Đang đóng gói ➔ Đã gửi bưu cục).

### 3.1. Hệ thống Tab Vận hành Chuẩn:
- 🟡 **Chờ thanh toán QR** (Chỉ đơn VietQR khách chưa quét mã, quá 15p tự hủy).
- 🔵 **Chờ soát đơn (`CONFIRMED`)**: Đơn mới cần kiểm tra thông tin.
- 📦 **Chờ gửi bưu cục (`PROCESSING`)**: Đơn đã soát xong, kho đang đóng gói. Đơn nằm ở đây là **CHƯA GỬI**.
- 🚚 **Đã gửi bên thứ 3 (`SHIPPED`)**: Đã giao bưu tá, hiển thị cột **Hãng vận chuyển**, **Mã vận đơn** và nút **Tra cứu bưu cục**.
- 🟢 **Giao thành công (`DELIVERED`)**.
- 🔴 **Hoàn / Hủy (`RETURNED` / `CANCELLED`)**.

### 3.2. Hiển thị Thông tin Thanh toán rõ ràng:
Tại mỗi dòng đơn hàng:
- Nếu là Chuyển khoản: Badge xanh lá `[ĐÃ TT (VietQR)]`.
- Nếu là COD: Badge cam `[THU HỘ COD: 1.250.000đ]` để nhân viên đóng gói nhìn thấy ngay số tiền cần in trên phiếu gửi hàng.

### 3.3. Các Nút Hành Động Theo Ngữ Cảnh (Contextual Action Buttons):
- **Ở bước Chờ soát (`CONFIRMED`)**: Nút **"Duyệt đóng gói"** + Nút **"Sửa SĐT / Địa chỉ"** (nếu khách cần đổi địa chỉ trước khi gửi).
- **Ở bước Đóng gói (`PROCESSING`)**: Nút **"Gửi bưu cục"** ➔ Mở popup chọn Hãng (GHN, Viettel Post...) & gõ Mã vận đơn ➔ Lưu lại và chuyển đơn sang `SHIPPED`.
- **Ở bước Đã gửi (`SHIPPED`)**: Hiển thị link bưu cục tra cứu trực tiếp. Khi bưu tá báo giao xong ➔ Bấm **"Đã giao thành công"**.

---

## 4. Lộ trình Triển khai Chuẩn hóa (Action Plan)

### 🟢 Giai đoạn 1: Chuẩn hóa Backend & Sửa triệt để các lỗi P0 (Phase 1)
- [ ] **Task 1.1: Hợp nhất luồng Checkout & Loại bỏ Nhân đôi Đơn hàng**
  - Chuyển `gio-hang/page.tsx` sang gọi `ordersApi.checkout()` duy nhất.
  - Sửa `orders.service.ts` và `payment.service.ts`: Xóa hoàn toàn lệnh insert trùng lặp trong `payment.service.ts`.
  - Nếu khách chọn PayOS: Tạo đơn `PENDING_PAYMENT`, gọi SDK sinh `checkoutUrl`.
  - Nếu khách chọn COD: Tạo đơn `CONFIRMED`, `payment_status: UNPAID` và chuyển thẳng đến trang thông báo thành công.
- [ ] **Task 1.2: Bảo mật Webhook PayOS tuyệt đối**
  - Thống nhất duy nhất 1 endpoint `/orders/webhook/payos`, bắt buộc verify HMAC chữ ký checksum từ PayOS.
  - Khi thanh toán thành công: Tự động chuyển `PENDING_PAYMENT` ➔ `CONFIRMED` và `payment_status: PAID`.
- [ ] **Task 1.3: Cập nhật Tồn kho An toàn (Atomic Stock Update)**
  - Update kho nguyên tử tránh âm kho khi nhiều khách đặt cùng một sản phẩm cùng lúc.

---

### 🟡 Giai đoạn 2: Tái cấu trúc Giao diện Admin "Soát Đơn & Quản lý Đã Gửi" (Phase 2)
- [ ] **Task 2.1: Bộ Tab Vận hành & Cột Hiển thị Hãng VC + Mã Vận Đơn**
  - Bổ sung bộ lọc trạng thái vận hành: *Chờ soát ➔ Chờ gửi bưu cục (Đang đóng) ➔ Đã gửi bên thứ 3 ➔ Đã giao*.
  - Hiển thị badge phân biệt rõ: `[ĐÃ THANH TOÁN]` vs `[THU HỘ COD: xxx.xxx đ]`.
- [ ] **Task 2.2: Modal Bàn giao Bưu cục & Gán Tracking Code**
  - Nút "Đã gửi bên thứ 3": Chọn Hãng vận chuyển (GHN, GHTK, Viettel Post, J&T...) + nhập Mã vận đơn.
  - Tự động tạo link tra cứu nhanh theo hãng (click vào mở thẳng trang bưu cục).
- [ ] **Task 2.3: Chức năng Sửa SĐT & Địa chỉ người nhận**
  - Cho phép Admin chỉnh sửa thông tin giao hàng khi đơn đang ở trạng thái `CONFIRMED` hoặc `PROCESSING` (chưa gửi bưu tá).
- [ ] **Task 2.4: Realtime Thanh toán PayOS**
  - Supabase Realtime channel tại trang kết quả thanh toán, tự động chúc mừng ngay khi quét mã QR thành công.

---

### 🔵 Giai đoạn 3: Tự động hóa API Bưu cục & In Vận đơn (Phase 3)
- [ ] **Task 3.1: Mẫu In Phiếu Xuất kho / Giao hàng (Packing Slip)**
  - Nút "In phiếu giao hàng" hiển thị mã đơn, tên hàng, địa chỉ và số tiền thu hộ COD để dán ngoài hộp.
- [ ] **Task 3.2: Tích hợp API Đơn vị vận chuyển (GHN / Viettel Post)**
  - Tự động lấy mã vận đơn từ bưu cục qua API chỉ bằng 1 click mà không cần gõ mã tay.
