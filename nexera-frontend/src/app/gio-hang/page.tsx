"use client";

import { useCartStore } from "@/store/cartStore";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  QrCode,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api/orders.api";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"PAYOS" | "COD">("PAYOS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast.error("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ.");
      return;
    }

    setIsSubmitting(true);

    try {
      const checkoutPayload = {
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email.trim() || undefined,
        shippingAddress: formData.address.trim(),
        paymentMethod: (paymentMethod === "PAYOS" ? "BANK_TRANSFER" : "COD") as "BANK_TRANSFER" | "COD",
        note: formData.notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const result = await ordersApi.checkout(checkoutPayload);

      if (!result.success || !result.order) {
        throw new Error(
          result.message || "Không thể khởi tạo đơn hàng. Vui lòng thử lại!"
        );
      }

      toast.success("Tạo đơn hàng thành công!");

      if (paymentMethod === "PAYOS") {
        if (result.checkoutUrl) {
          // Chuyển hướng sang cổng thanh toán VietQR PayOS
          window.location.href = result.checkoutUrl;
          return;
        } else {
          clearCart();
          const code = result.order.orderCode || result.order.id;
          router.push(`/thanh-toan/ket-qua?status=PAID&orderCode=${code}`);
        }
      } else {
        // COD
        clearCart();
        const code = result.order.orderCode || result.order.id;
        router.push(`/thanh-toan/ket-qua?status=SUCCESS&orderCode=${code}`);
      }
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      toast.error(
        err.message || "Có lỗi xảy ra khi kết nối tới máy chủ thanh toán."
      );
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#13426E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#13426E]">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#13426E] font-medium">Giỏ hàng</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[#13426E] mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-[#80BF49]" />
          Giỏ hàng của bạn
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-500 mb-8">
              Chưa có sản phẩm nào trong giỏ hàng của bạn.
            </p>
            <Link
              href="/san-pham"
              className="px-8 py-3 bg-[#13426E] text-white rounded-xl font-semibold hover:bg-[#1a5b99] transition-colors inline-flex items-center gap-2"
            >
              Về trang Sản phẩm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Cart Items */}
            <div className="w-full lg:w-2/3 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-600">
                  <div className="col-span-6">Sản phẩm</div>
                  <div className="col-span-2 text-center">Đơn giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-right pr-4">Thành tiền</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                      {/* Product Info */}
                      <div className="col-span-1 md:col-span-6 flex gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-xl border border-gray-100 shrink-0 flex items-center justify-center p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url || "/doi.png"}
                            alt={item.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded w-fit mb-1.5">
                            {item.type === "EQUIPMENT" ? "Thiết bị" : "Trọn gói"}
                          </span>
                          <Link
                            href={`/san-pham?q=${item.name}`}
                            className="font-semibold text-[#13426E] hover:text-[#80BF49] transition-colors line-clamp-2 text-sm md:text-base"
                          >
                            {item.name}
                          </Link>
                          <div className="md:hidden text-xs text-gray-500 font-medium mt-1">
                            Đơn giá: <span className="text-gray-700 font-bold">{new Intl.NumberFormat("vi-VN").format(item.price)}₫</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 text-xs sm:text-sm hover:underline mt-1.5 w-fit flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </div>
                      </div>

                      {/* Price (Desktop) */}
                      <div className="hidden md:block col-span-2 text-center font-medium text-gray-600">
                        {new Intl.NumberFormat("vi-VN").format(item.price)}₫
                      </div>

                      {/* Quantity & Subtotal (Mobile + Desktop) */}
                      <div className="col-span-1 md:col-span-4 flex items-center justify-between gap-3 md:contents pt-3 md:pt-0 border-t border-gray-100 md:border-0">
                        {/* Quantity Controls */}
                        <div className="md:col-span-2 flex justify-start md:justify-center">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white h-8 sm:h-9 w-24 sm:w-28 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="w-8 sm:w-9 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#13426E] transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="flex-1 text-center font-semibold text-xs sm:text-sm text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="w-8 sm:w-9 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#13426E] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="md:col-span-2 text-right pr-0 md:pr-4 font-bold text-[#E30019] text-base md:text-lg">
                          <span className="md:hidden text-xs text-gray-400 font-normal mr-1">Thành tiền:</span>
                          {new Intl.NumberFormat("vi-VN").format(
                            item.price * item.quantity
                          )}
                          ₫
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/san-pham"
                className="inline-flex items-center gap-2 text-[#13426E] font-medium hover:text-[#80BF49] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Tiếp tục mua sắm
              </Link>
            </div>

            {/* Right: Order Summary & Form */}
            <div className="w-full lg:w-1/3">
              <form
                onSubmit={handleSubmitOrder}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6 sticky top-24"
              >
                {/* Summary */}
                <div>
                  <h2 className="text-xl font-bold text-[#13426E] mb-5">
                    Tóm tắt đơn hàng
                  </h2>
                  <div className="space-y-3 text-gray-600 mb-5 pb-5 border-b border-gray-100">
                    <div className="flex justify-between">
                      <span>Tạm tính</span>
                      <span className="font-medium text-gray-800">
                        {new Intl.NumberFormat("vi-VN").format(totalPrice())}₫
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển</span>
                      <span className="text-[#80BF49] font-medium">Miễn phí</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-gray-800">Tổng cộng</span>
                    <span className="text-2xl font-bold text-[#E30019]">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalPrice())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">
                    (Đã bao gồm VAT nếu có)
                  </p>
                </div>

                {/* Phương thức thanh toán */}
                <div className="space-y-3 pt-2">
                  <label className="font-semibold text-[#13426E] block text-sm">
                    Hình thức thanh toán
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* PayOS VietQR */}
                    <div
                      onClick={() => setPaymentMethod("PAYOS")}
                      className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                        paymentMethod === "PAYOS"
                          ? "border-[#13426E] bg-blue-50/40 shadow-xs"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#13426E] text-white flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                            Chuyển khoản VietQR (PayOS)
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              Tự động 24/7
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Quét mã QR bằng bất kỳ ứng dụng ngân hàng nào
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === "PAYOS"
                            ? "border-[#13426E] bg-[#13426E]"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === "PAYOS" && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* COD */}
                    <div
                      onClick={() => setPaymentMethod("COD")}
                      className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                        paymentMethod === "COD"
                          ? "border-[#13426E] bg-blue-50/40 shadow-xs"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">
                            Thanh toán khi nhận hàng (COD)
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Trả tiền mặt khi nhân viên giao hàng tới
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMethod === "COD"
                            ? "border-[#13426E] bg-[#13426E]"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === "COD" && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Thông tin liên hệ */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold text-[#13426E] text-sm">
                    Thông tin người nhận
                  </h3>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Họ và tên người nhận *"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Số điện thoại *"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email (tùy chọn)"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                      />
                    </div>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Địa chỉ chi tiết nhận hàng *"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                    />
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Ghi chú đơn hàng (ví dụ: giao giờ hành chính...)"
                      rows={2}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E] resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#13426E] text-white rounded-xl font-bold text-base hover:bg-[#1a5b99] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {paymentMethod === "PAYOS"
                        ? "Thanh toán với VietQR"
                        : "Xác nhận đặt hàng COD"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    Thông tin thanh toán được mã hóa và xác thực an toàn qua cổng
                    VietQR / PayOS.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
