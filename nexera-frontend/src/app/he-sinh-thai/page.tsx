import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/home/ContactForm";
import { Cpu, Zap, Building2, BriefcaseBusiness, ChevronRight } from "lucide-react";

export default function EcosystemPage() {
  const solutions = [
    {
      id: "smart-tech",
      icon: Cpu,
      title: "Công nghệ thông minh",
      items: [
        { name: "Tư vấn chuyển đổi số", desc: "Chiến lược, Kiến trúc doanh nghiệp số" },
        { name: "Giải pháp công nghệ", desc: "AI, IoT, Big Data, Điện toán đám mây, Camera AI" },
        { name: "Hệ thống quản trị", desc: "ERP, CRM, Văn phòng thông minh, Đô thị thông minh" },
      ]
    },
    {
      id: "green-energy",
      icon: Zap,
      title: "Năng lượng xanh",
      items: [
        { name: "Điện mặt trời", desc: "Tổng thầu EPC, Điện mặt trời áp mái, Điện mặt trời trang trại" },
        { name: "Lưu trữ năng lượng", desc: "ESS, BESS, Pin Lithium" },
        { name: "Quản lý năng lượng", desc: "Hệ thống quản lý năng lượng, Kiểm toán năng lượng" },
        { name: "Hạ tầng giao thông xanh", desc: "Xe điện, Trạm sạc AC/DC" },
      ]
    },
    {
      id: "infrastructure",
      icon: Building2,
      title: "Hạ tầng thông minh & Đầu tư",
      items: [
        { name: "Tư vấn đầu tư", desc: "Lập dự án, Huy động vốn" },
        { name: "Tư vấn xây dựng & Thi công", desc: "Khảo sát, Thiết kế, Quản lý dự án, Thi công" },
        { name: "Nông nghiệp công nghệ cao", desc: "Trang trại thông minh, Nhà kính, Nông nghiệp tuần hoàn" },
      ]
    },
    {
      id: "business-solutions",
      icon: BriefcaseBusiness,
      title: "Giải pháp doanh nghiệp",
      items: [
        { name: "Truyền thông & Thương hiệu", desc: "Tiếp thị kỹ thuật số, PR, Website, Sự kiện" },
        { name: "Tư vấn pháp lý", desc: "Doanh nghiệp, Đầu tư, Hợp đồng, Đất đai" },
        { name: "Bất động sản", desc: "Phát triển dự án, Quản lý vận hành" },
      ]
    }
  ];

  return (
    <>
      <PageHeader title="Hệ Sinh Thái Giải Pháp" breadcrumb="Hệ sinh thái" />

      {/* Intro */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#13426E] mb-4 sm:mb-6 uppercase">Hệ Sinh Thái Giải Pháp Nexera</h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            Chúng tôi cung cấp một hệ sinh thái toàn diện, từ công nghệ số, năng lượng tái tạo đến hạ tầng và quản trị doanh nghiệp. Với mô hình <strong>Giải pháp Trọn gói</strong>, khách hàng chỉ cần một đối tác duy nhất cho toàn bộ vòng đời dự án.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-12 sm:py-16 bg-[#F0F7FB]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {solutions.map((sol) => (
              <div key={sol.id} id={sol.id} className="bg-white scroll-mt-24 rounded-2xl shadow-lg p-5 sm:p-8 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-100">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F0F7FB] rounded-full flex items-center justify-center text-[#80BF49] shrink-0">
                    <sol.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#13426E]">{sol.title}</h3>
                  </div>
                </div>
                <div className="space-y-6">
                  {sol.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <ChevronRight className="w-5 h-5 text-[#80BF49] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-[#13426E]">{item.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Form */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
