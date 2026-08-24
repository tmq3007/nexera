import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/home/ContactForm";
import { BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function BusinessSolutionsPage() {
  const features = [
    { name: "Truyền thông & Thương hiệu", desc: "Chiến lược truyền thông, tiếp thị kỹ thuật số, PR, tổ chức sự kiện và xây dựng bộ nhận diện thương hiệu." },
    { name: "Tư vấn pháp lý", desc: "Tư vấn doanh nghiệp, đầu tư, hợp đồng, bất động sản, sở hữu trí tuệ và quản trị rủi ro pháp lý." },
    { name: "Bất động sản & Phát triển dự án", desc: "Đầu tư và phát triển khu đô thị, khu công nghiệp, thương mại dịch vụ tích hợp công nghệ xanh." },
    { name: "Thương mại & Phân phối", desc: "Phân phối thiết bị công nghệ, năng lượng, vật tư kỹ thuật và vận hành chuỗi siêu thị thông minh." }
  ];

  return (
    <>
      <PageHeader title="Giải Pháp Doanh Nghiệp" breadcrumb="Hệ sinh thái / Doanh nghiệp" />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative aspect-square md:aspect-video lg:aspect-[4/5] bg-gray-200 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/doi.png" alt="Giải pháp doanh nghiệp" fill className="object-cover" />
              <div className="absolute inset-0 bg-[#13426E]/10"></div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#F0F7FB] rounded-full flex items-center justify-center text-[#13426E]">
                  <BriefcaseBusiness className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-[#13426E]">Giải pháp doanh nghiệp</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Bên cạnh công nghệ và hạ tầng, Nexera mang đến nhóm Giải pháp doanh nghiệp và Phát triển thương mại toàn diện. Chúng tôi đồng hành cùng khách hàng trong việc định vị thương hiệu, đảm bảo hành lang pháp lý an toàn và khai thác tối đa giá trị bất động sản.
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
