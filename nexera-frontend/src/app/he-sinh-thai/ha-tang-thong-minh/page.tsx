import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/home/ContactForm";
import { Building2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function SmartInfrastructurePage() {
  const features = [
    { name: "Tư vấn đầu tư & Lập dự án", desc: "Lập chủ trương đầu tư, báo cáo khả thi, tư vấn huy động vốn và phương án đầu tư tối ưu." },
    { name: "Tư vấn thiết kế & Xây dựng", desc: "Khảo sát, thiết kế, lập dự toán, quản lý dự án, thẩm tra và tư vấn đấu thầu." },
    { name: "Thiết kế và thi công (EPC)", desc: "Thi công công trình dân dụng, công nghiệp, hạ tầng kỹ thuật và công trình năng lượng." },
    { name: "Nông nghiệp công nghệ cao", desc: "Phát triển nông nghiệp thông minh, nhà màng, nhà kính kết hợp hệ thống tưới tự động và điện mặt trời." }
  ];

  return (
    <>
      <PageHeader title="Hạ Tầng Thông Minh" breadcrumb="Hệ sinh thái / Hạ tầng" />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#F0F7FB] rounded-full flex items-center justify-center text-[#13426E]">
                  <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-[#13426E]">Hạ tầng thông minh</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Lĩnh vực Hạ tầng thông minh và Đầu tư xây dựng của Nexera tập trung vào việc tạo ra các không gian sống và sản xuất hiện đại, kết nối và bền vững. Chúng tôi tích hợp chặt chẽ công nghệ thông minh, năng lượng xanh vào từng công trình.
              </p>
              
              <div className="space-y-4">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-[#F0F7FB] rounded-xl border border-transparent hover:border-[#13426E]/20 transition-colors">
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
              <Image src="/doi.png" alt="Hạ tầng thông minh" fill className="object-cover" />
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
