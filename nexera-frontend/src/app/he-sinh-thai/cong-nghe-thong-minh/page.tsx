import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/home/ContactForm";
import { Cpu, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function SmartTechPage() {
  const features = [
    { name: "Tư vấn chuyển đổi số", desc: "Xây dựng chiến lược chuyển đổi số, tư vấn kiến trúc doanh nghiệp số toàn diện." },
    { name: "Trí tuệ nhân tạo (AI) & vạn vật kết nối (IoT)", desc: "Ứng dụng AI phân tích dữ liệu, IoT kết nối vạn vật, tối ưu hóa quy trình." },
    { name: "Dữ liệu lớn (Big Data) & Điện toán đám mây", desc: "Quản trị dữ liệu lớn, điện toán đám mây linh hoạt và bảo mật cao." },
    { name: "Trung tâm điều hành thông minh (IOC)", desc: "Xây dựng hệ thống điều hành tập trung cho doanh nghiệp và cơ quan quản lý." },
    { name: "Hệ thống quản trị doanh nghiệp", desc: "Cung cấp giải pháp ERP, CRM, Văn phòng thông minh, Nhà máy thông minh." }
  ];

  return (
    <>
      <PageHeader title="Công Nghệ Thông Minh" breadcrumb="Hệ sinh thái / Công nghệ" />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#F0F7FB] rounded-full flex items-center justify-center text-[#13426E]">
                  <Cpu className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-[#13426E]">Công nghệ thông minh</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Nexera cung cấp các giải pháp công nghệ thông minh đột phá, giúp doanh nghiệp, cơ quan tổ chức tăng tốc trên lộ trình chuyển đổi số. Chúng tôi không chỉ cung cấp phần mềm mà còn tái tạo quy trình, ứng dụng AI, IoT để tạo ra sự bứt phá về năng suất và hiệu quả quản trị.
              </p>
              
              <div className="space-y-4">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-[#F0F7FB] rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-[#80BF49] flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-[#13426E]">{feat.name}</h4>
                      <p className="text-gray-600 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-square md:aspect-video lg:aspect-[4/5] bg-gray-200 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/doi.png" alt="Công nghệ thông minh" fill className="object-cover" />
              <div className="absolute inset-0 bg-[#13426E]/10"></div>
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
