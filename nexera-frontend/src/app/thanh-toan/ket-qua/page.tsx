"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import {
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowRight,
  PackageCheck,
  Clock,
} from "lucide-react";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();

  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const isMock = searchParams.get("mock") === "true";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuccess = status === "PAID" || status === "SUCCESS";

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }

    if (orderCode) {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      fetch(`${backendUrl}/payment/order/${orderCode}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setOrder(data);
        })
        .catch((err) => {
          console.warn("Không thể lấy chi tiết đơn hàng:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderCode, isSuccess, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#13426E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-medium">Đang kiểm tra kết quả giao dịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          {isSuccess ? (
            <>
              {/* Success Badge */}
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>

              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                {isMock ? "Thử nghiệm thành công" : "Thanh toán thành công"}
              </span>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#13426E] mb-3">
                Cảm ơn bạn đã đặt hàng!
              </h1>

              <p className="text-gray-600 mb-8 text-sm md:text-base">
                Giao dịch của bạn đã được ghi nhận. Hệ thống Nexera đang tiến hành chuẩn bị đơn hàng để vận chuyển tới bạn trong thời gian sớm nhất.
              </p>

              {/* Order Info Card */}
              <div className="bg-gray-50/80 rounded-2xl p-6 mb-8 text-left border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-3">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-bold text-[#13426E]">#{orderCode || "---"}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-3">
                  <span className="text-gray-500">Phương thức:</span>
                  <span className="font-semibold text-gray-800">
                    {order?.payment_method === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản VietQR (PayOS)"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-3">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <PackageCheck className="w-4 h-4" />
                    {order?.status === "PAID" ? "Đã thanh toán" : "Đã xác nhận"}
                  </span>
                </div>
                {order?.total_amount && (
                  <div className="flex justify-between items-center text-base pt-1">
                    <span className="font-semibold text-gray-700">Tổng thanh toán:</span>
                    <span className="font-extrabold text-[#E30019] text-xl">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total_amount)}
                    </span>
                  </div>
                )}
              </div>

              {isMock && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 mb-6 text-left">
                  💡 <strong>Ghi chú phát triển (Mock Mode):</strong> Cổng PayOS đang chạy ở chế độ kiểm thử giả lập. Khi bạn điền `PAYOS_CLIENT_ID`, `PAYOS_API_KEY` và `PAYOS_CHECKSUM_KEY` vào file `.env` của backend, khách hàng sẽ quét mã QR ngân hàng thật 100%.
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/san-pham"
                  className="px-6 py-3.5 bg-[#13426E] text-white rounded-xl font-semibold hover:bg-[#1a5b99] transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Tiếp tục mua sắm
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  Về trang chủ
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Failed / Cancelled Badge */}
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-rose-500" />
              </div>

              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                Giao dịch chưa hoàn tất
              </span>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#13426E] mb-3">
                Thanh toán chưa thành công
              </h1>

              <p className="text-gray-600 mb-8 text-sm md:text-base">
                Bạn đã hủy hoặc giao dịch thanh toán chưa được xác nhận. Đừng lo lắng, giỏ hàng của bạn vẫn được lưu lại để bạn tiếp tục thanh toán.
              </p>

              {orderCode && (
                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm text-gray-600">
                  Mã đơn hàng tham chiếu: <strong className="text-gray-800">#{orderCode}</strong>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/gio-hang"
                  className="px-6 py-3.5 bg-[#13426E] text-white rounded-xl font-semibold hover:bg-[#1a5b99] transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Thử thanh toán lại
                </Link>
                <Link
                  href="/san-pham"
                  className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  Xem thêm sản phẩm
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#13426E] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
