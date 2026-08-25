"use client";

import { useCartStore } from "@/store/cartStore";
import { siteConfig } from "@/config/site";
import { Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Truck, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    
    // Simulate API Call for placing order
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSuccess(true);
      clearCart();
      toast.success("Đặt hàng thành công!");
    }, 1500);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#13426E] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-16 flex flex-col items-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-[#13426E] mb-4">Đặt hàng thành công!</h1>
            <p className="text-gray-600 mb-8 max-w-md">
              Cảm ơn bạn đã tin tưởng Nexera. Đơn hàng của bạn đã được ghi nhận và chúng tôi sẽ liên hệ trong thời gian sớm nhất để xác nhận.
            </p>
            <Link 
              href="/san-pham"
              className="px-8 py-3.5 bg-[#13426E] text-white rounded-xl font-semibold hover:bg-[#1a5b99] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#13426E]">Trang chủ</Link>
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
             <h2 className="text-xl font-semibold text-gray-800 mb-2">Giỏ hàng trống</h2>
             <p className="text-gray-500 mb-8">Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
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
                  {items.map(item => (
                    <div key={item.id} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="col-span-1 md:col-span-6 flex gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-xl border border-gray-100 shrink-0 flex items-center justify-center p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image_url || "/doi.png"} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded w-fit mb-1.5">
                            {item.type === "EQUIPMENT" ? "Thiết bị" : "Trọn gói"}
                          </span>
                          <Link href={`/san-pham?q=${item.name}`} className="font-semibold text-[#13426E] hover:text-[#80BF49] transition-colors line-clamp-2 text-sm md:text-base">
                            {item.name}
                          </Link>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm hover:underline mt-2 w-fit flex items-center gap-1">
                             <Trash2 className="w-3.5 h-3.5" />
                             Xóa
                          </button>
                        </div>
                      </div>

                      {/* Price (Mobile hidden, Desktop shown) */}
                      <div className="hidden md:block col-span-2 text-center font-medium text-gray-600">
                        {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                      </div>

                      {/* Quantity & Price (Mobile stacked, Desktop split) */}
                      <div className="col-span-1 md:col-span-4 flex items-center justify-between md:contents">
                        
                        {/* Mobile Price */}
                        <div className="md:hidden font-medium text-[#E30019]">
                           {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                        </div>

                        {/* Quantity Controls */}
                        <div className="md:col-span-2 flex justify-center">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white h-9 w-28 overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-9 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#13426E] transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-center font-medium text-gray-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-9 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#13426E] transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="md:col-span-2 text-right pr-0 md:pr-4 font-bold text-[#E30019] text-base md:text-lg">
                          {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}₫
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/san-pham" className="inline-flex items-center gap-2 text-[#13426E] font-medium hover:text-[#80BF49] transition-colors">
                 <ArrowLeft className="w-4 h-4" />
                 Tiếp tục mua sắm
              </Link>
            </div>

            {/* Right: Order Summary & Form */}
            <div className="w-full lg:w-1/3">
              <form onSubmit={handleSubmitOrder} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8 sticky top-32">
                
                {/* Summary */}
                <div>
                  <h2 className="text-xl font-bold text-[#13426E] mb-6">Tóm tắt đơn hàng</h2>
                  <div className="space-y-3 text-gray-600 mb-6 pb-6 border-b border-gray-100">
                    <div className="flex justify-between">
                      <span>Tạm tính</span>
                      <span className="font-medium text-gray-800">{new Intl.NumberFormat('vi-VN').format(totalPrice())}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển</span>
                      <span className="text-[#80BF49] font-medium">Miễn phí</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-gray-800">Tổng cộng</span>
                    <span className="text-2xl md:text-3xl font-bold text-[#E30019]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">(Đã bao gồm VAT nếu có)</p>
                </div>

                {/* Form Thông tin */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#13426E]">Thông tin liên hệ</h3>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Họ và tên *" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Số điện thoại *" 
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                      />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email (tùy chọn)" 
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                      />
                    </div>
                    <input 
                      type="text" 
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Địa chỉ giao hàng *" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                    />
                    <textarea 
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Ghi chú đơn hàng (tùy chọn)" 
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E] resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Submit */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#13426E] text-white rounded-xl font-bold text-lg hover:bg-[#1a5b99] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Đặt hàng ngay
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <div className="flex items-start gap-2 mt-4 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                  <p>Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi sẽ gọi điện xác nhận đơn hàng trước khi giao.</p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
