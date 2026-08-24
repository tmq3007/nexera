import { PageHeader } from "@/components/layout/PageHeader";
import { Lightbulb, Target, Handshake, Sprout, Star, HeartHandshake } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Về Chúng Tôi" breadcrumb="Giới thiệu" />

      {/* Intro Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#13426E] mb-6">CÔNG TY TNHH CÔNG NGHỆ XANH NEXERA</h2>
            <h3 className="text-xl md:text-2xl font-semibold text-[#80BF49] mb-8 uppercase">
              Smart Technology • Green Energy • Sustainable Future
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed text-justify md:text-center">
              <strong className="text-[#13426E]">NEXERA</strong> là doanh nghiệp cung cấp Hệ sinh thái Giải pháp Tích hợp (Integrated Solutions Ecosystem), hoạt động trong các lĩnh vực công nghệ xanh, truyền thông, đầu tư xây dựng, năng lượng tái tạo, bất động sản và giải pháp doanh nghiệp. Chúng tôi đồng hành cùng cơ quan nhà nước, doanh nghiệp, nhà đầu tư và khách hàng trong quá trình chuyển đổi số, chuyển đổi xanh và phát triển bền vững, thông qua các giải pháp đồng bộ từ tư vấn chiến lược, đầu tư, thiết kế, thi công đến vận hành và tối ưu hệ thống.
            </p>
          </div>
        </div>
      </section>

      {/* Ý nghĩa thương hiệu */}
      <section className="py-16 bg-[#F0F7FB]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl">
              <Image src="/doi.png" alt="Ý nghĩa thương hiệu Nexera" fill className="object-cover" />
              <div className="absolute inset-0 bg-[#13426E]/20"></div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-[#13426E]">VÌ SAO CHỌN NEXERA?</h2>
              <div className="border-l-4 border-[#80BF49] pl-6 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#80BF49]">NEX</h3>
                  <p className="text-gray-700 mt-2">Lấy cảm hứng từ Next – Thế hệ tiếp theo, đại diện cho công nghệ tương lai, tư duy đổi mới, sự kết nối và khát vọng vươn tới những giá trị mới.</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#80BF49]">ERA</h3>
                  <p className="text-gray-700 mt-2">Mang ý nghĩa Kỷ nguyên, đại diện cho một kỷ nguyên mới của công nghệ, năng lượng xanh, chuyển đổi số và phát triển bền vững.</p>
                </div>
              </div>
              <p className="text-xl font-semibold text-[#13426E] pt-4">“Kiến tạo kỷ nguyên mới” — Creating the Next Era</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tầm nhìn & Sứ mệnh */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#13426E] text-white p-10 rounded-2xl shadow-xl flex flex-col items-center text-center group hover:bg-[#80BF49] transition-colors duration-500">
              <Target className="w-16 h-16 mb-6 text-[#80BF49] group-hover:text-white transition-colors" />
              <h2 className="text-3xl font-bold uppercase mb-4">Tầm nhìn</h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Trở thành doanh nghiệp hàng đầu Việt Nam và từng bước vươn ra khu vực trong lĩnh vực cung cấp Hệ sinh thái Giải pháp Tích hợp; tiên phong ứng dụng công nghệ xanh, trí tuệ nhân tạo, chuyển đổi số và đổi mới sáng tạo, góp phần xây dựng nền kinh tế số, kinh tế xanh và không gian sống hiện đại, bền vững.
              </p>
            </div>
            <div className="bg-[#13426E] text-white p-10 rounded-2xl shadow-xl flex flex-col items-center text-center group hover:bg-[#80BF49] transition-colors duration-500">
              <Lightbulb className="w-16 h-16 mb-6 text-[#80BF49] group-hover:text-white transition-colors" />
              <h2 className="text-3xl font-bold uppercase mb-4">Sứ mệnh</h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Mang đến các giải pháp tổng thể từ tư vấn chiến lược, tư vấn đầu tư, bất động sản, tư vấn pháp lý, thiết kế, xây dựng, công nghệ xanh, truyền thông đến vận hành thông minh, giúp khách hàng tối ưu chi phí, nâng cao hiệu quả đầu tư, giảm phát thải, quản trị rủi ro và tạo ra giá trị bền vững.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="py-16 bg-[#F0F7FB]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#13426E] mb-12 uppercase">Giá Trị Cốt Lõi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: Lightbulb, title: "Innovation", desc: "Đổi mới sáng tạo" },
              { icon: Handshake, title: "Integrity", desc: "Chính trực và minh bạch" },
              { icon: Star, title: "Excellence", desc: "Chất lượng và chuyên nghiệp" },
              { icon: HeartHandshake, title: "Collaboration", desc: "Hợp tác cùng phát triển" },
              { icon: Sprout, title: "Sustainability", desc: "Phát triển bền vững" },
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 mx-auto bg-[#F0F7FB] rounded-full flex items-center justify-center mb-4 text-[#80BF49]">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl text-[#13426E] mb-2">{item.title}</h3>
                <p className="text-gray-600 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Triết lý kinh doanh */}
      <section className="py-20 relative text-white">
         <Image src="/doi.png" alt="Triết lý kinh doanh" fill className="object-cover" />
         <div className="absolute inset-0 bg-[#13426E]/80"></div>
         <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <h2 className="text-3xl font-bold uppercase mb-8">Triết Lý Kinh Doanh</h2>
            <p className="text-3xl md:text-4xl font-bold text-[#80BF49] mb-8 italic">
              "Một đối tác – Nhiều giải pháp – Giá trị bền vững"
            </p>
            <p className="text-lg text-white/90 leading-relaxed">
              NEXERA không chỉ cung cấp sản phẩm hay dịch vụ. Chúng tôi đồng hành cùng khách hàng trong toàn bộ vòng đời của dự án, từ ý tưởng, đầu tư, phát triển, triển khai đến vận hành, bảo trì và nâng cấp.
            </p>
         </div>
      </section>
    </>
  );
}
