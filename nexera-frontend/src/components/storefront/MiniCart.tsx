"use client";

import { useCartStore } from "@/store/cartStore";
import { X, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MiniCart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-[#13426E]/50 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[100] flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#13426E]">Giỏ hàng của bạn</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#13426E] hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {!mounted ? null : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingCartIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500">Giỏ hàng của bạn đang trống</p>
              <button onClick={onClose} className="text-[#80BF49] font-semibold hover:underline">
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url || "/doi.png"} alt={item.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-semibold text-[#13426E] line-clamp-2">{item.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[#E30019] font-bold text-sm mt-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </div>
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white h-8 w-24">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#13426E] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center text-sm font-medium text-gray-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#13426E] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mounted && items.length > 0 && (
          <div className="border-t border-gray-100 p-4 md:p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Tổng cộng:</span>
              <span className="text-xl font-bold text-[#E30019]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice())}
              </span>
            </div>
            <Link href="/gio-hang" onClick={onClose} className="w-full py-3.5 bg-[#13426E] text-white rounded-xl font-semibold hover:bg-[#1a5b99] transition-colors flex items-center justify-center gap-2 shadow-sm">
              Xem chi tiết giỏ hàng
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function ShoppingCartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
