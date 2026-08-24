import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/home/ContactForm";
import { Zap, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function GreenEnergyPage() {
  const features = [
    { name: "Điện mặt trời", desc: "Tổng thầu EPC, điện mặt trời áp mái, điện mặt trời trang trại, hệ thống Hybrid cho mọi quy mô." },
    { name: "Lưu trữ năng lượng (ESS & BESS)", desc: "Cung cấp hệ thống pin Lithium, ắc quy công nghiệp lưu trữ năng lượng quy mô lớn." },
    { name: "Quản lý năng lượng", desc: "Hệ thống quản lý năng lượng, kiểm toán năng lượng và các giải pháp tiết kiệm." },
    { name: "Xe điện & Hạ tầng giao thông xanh", desc: "Cung cấp trạm sạc AC/DC, giải pháp giao thông xanh cho đô thị thông minh." }
  ];

  return (
    <>
      <PageHeader title="Năng Lượng Xanh" breadcrumb="Hệ sinh thái / Năng lượng xanh" />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative aspect-square md:aspect-video lg:aspect-[4/5] bg-gray-200 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/doi.png" alt="Năng lượng xanh" fill className="object-cover" />
              <div className="absolute inset-0 bg-[#80BF49]/10"></div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#F0F7FB] rounded-full flex items-center justify-center text-[#80BF49]">
                  <Zap className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-[#13426E]">Năng lượng xanh</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Nexera tự hào là đơn vị tiên phong trong lĩnh vực năng lượng tái tạo, mang đến giải pháp toàn diện từ tư vấn, thiết kế, thi công đến vận hành hệ thống điện mặt trời và lưu trữ năng lượng. Chúng tôi cam kết đồng hành cùng mục tiêu Net Zero của Việt Nam.
              </p>
              
              <div className="space-y-4">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-[#F0F7FB] rounded-xl border border-transparent hover:border-[#80BF49] transition-colors">
                    <CheckCircle2 className="w-6 h-6 text-[#80BF49] flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-[#13426E]">{feat.name}</h4>
                      <p className="text-gray-600 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F0F7FB]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
