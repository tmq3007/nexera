import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";
import { ContactForm } from "@/components/home/ContactForm";

export default function ProductsPage() {
  const products = [
    {
      id: "thiet-bi",
      title: "Tấm Pin Năng Lượng Mặt Trời",
      desc: "Phân phối chính hãng các dòng pin mặt trời hiệu suất cao từ các thương hiệu hàng đầu thế giới.",
      features: ["Công suất từ 450W - 600W+", "Công nghệ Half-cell, Bifacial", "Bảo hành hiệu suất 25 năm"],
    },
    {
      id: "inverter",
      title: "Biến Tần (Inverter)",
      desc: "Cung cấp biến tần hòa lưới, độc lập và Hybrid phù hợp cho cả dân dụng và công nghiệp.",
      features: ["Hiệu suất chuyển đổi >98%", "Giám sát thông minh qua App", "Bảo hành từ 5-10 năm"],
    },
    {
      id: "tron-goi",
      title: "Gói Lắp Đặt Trọn Gói",
      desc: "Giải pháp lắp đặt EPC (Từ khảo sát, thiết kế, thi công đến bàn giao và bảo trì).",
      features: ["Gói hộ gia đình (3kW - 15kW)", "Gói công nghiệp (>100kW)", "Thủ tục điện lực miễn phí"],
    }
  ];

  return (
    <>
      <PageHeader title="Thiết Bị & Gói Lắp Đặt" breadcrumb="Sản phẩm" />

      <section className="py-16 bg-[#F0F7FB]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} id={product.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col scroll-mt-24">
                <div className="relative aspect-video bg-gray-200">
                  <Image src="/doi.png" alt={product.title} fill className="object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#13426E] mb-3">{product.title}</h3>
                  <p className="text-gray-600 mb-6 flex-1">{product.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-[#80BF49] rounded-full"></span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 bg-[#13426E] text-white rounded-lg font-bold hover:bg-[#80BF49] transition-colors">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
