"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      
      // Reset after 3s
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl p-6 md:p-10 w-full shadow-xl border border-gray-100">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-[#13426E] mb-8 uppercase">
        Nhận Tư Vấn Lắp Đặt Điện Năng Lượng Mặt Trời
      </h2>

      {success ? (
        <div className="bg-[#F0F7FB] border border-[#80BF49] text-[#13426E] p-6 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">Đăng ký thành công!</h3>
          <p>Cảm ơn bạn đã quan tâm. Chuyên viên của chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[#80BF49] font-bold">Họ và tên:</label>
              <input 
                type="text" 
                id="name" 
                required 
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                placeholder="Nhập họ và tên..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-[#80BF49] font-bold">Số điện thoại:</label>
              <input 
                type="tel" 
                id="phone" 
                required 
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                placeholder="Nhập số điện thoại..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="province" className="block text-[#80BF49] font-bold">Tỉnh Thành:</label>
              <input 
                type="text" 
                id="province" 
                required 
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                placeholder="Nhập tỉnh thành..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="bill" className="block text-[#80BF49] font-bold">Tiền điện trung bình/tháng:</label>
              <input 
                type="text" 
                id="bill" 
                required 
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E]"
                placeholder="Nhập số tiền..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="type" className="block text-[#80BF49] font-bold">Loại điện sử dụng:</label>
              <select 
                id="type" 
                required
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E] bg-white appearance-none"
              >
                <option value="">Chọn loại điện</option>
                <option value="1pha">Điện 1 pha</option>
                <option value="3pha">Điện 3 pha</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="purpose" className="block text-[#80BF49] font-bold">Mục đích lắp đặt:</label>
              <select 
                id="purpose" 
                required
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#13426E] focus:ring-1 focus:ring-[#13426E] bg-white appearance-none"
              >
                <option value="">Chọn mục đích</option>
                <option value="giadinh">Lắp cho gia đình</option>
                <option value="sanxuat">Lắp cho sản xuất</option>
                <option value="kinhdoanh">Lắp cho kinh doanh</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-center">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#13426E] text-white text-lg font-bold py-3 px-10 rounded-full hover:bg-[#80BF49] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin h-5 w-5" />}
              ĐĂNG KÝ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
