import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();
  
  const { data: projectsData } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const categoryMap: Record<string, any> = {
    INDUSTRIAL: {
      id: "cong-nghiep",
      title: "Dự án Công nghiệp & Thương mại",
      desc: "Giải pháp tối ưu hóa chi phí điện năng, tăng tính cạnh tranh và đáp ứng tiêu chuẩn xanh cho các nhà máy, khu công nghiệp và doanh nghiệp lớn.",
      projects: []
    },
    RESIDENTIAL: {
      id: "dan-dung",
      title: "Dự án Dân dụng & Hộ gia đình",
      desc: "Hệ thống điện mặt trời áp mái an toàn, thẩm mỹ, giúp các hộ gia đình tiết kiệm tối đa hóa đơn tiền điện và tự chủ năng lượng.",
      projects: []
    },
    AGRICULTURAL: {
      id: "nong-nghiep",
      title: "Nông nghiệp Công nghệ cao",
      desc: "Kết hợp điện mặt trời với mô hình Smart Farm, nhà kính, hệ thống tưới tiêu thông minh, tạo ra giải pháp nông nghiệp tuần hoàn đột phá.",
      projects: []
    }
  };

  projectsData?.forEach((p) => {
    if (categoryMap[p.category]) {
      categoryMap[p.category].projects.push(p);
    }
  });

  const categories = Object.values(categoryMap).filter(c => c.projects.length > 0);

  return (
    <>
      <PageHeader title="Dự Án Tiêu Biểu" breadcrumb="Dự án" />

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl font-bold text-[#13426E] mb-6 uppercase">Hàng Trăm Dự Án Thành Công Trên Toàn Quốc</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            NEXERA tự hào đã triển khai hơn <strong className="text-[#80BF49]">113,5 MWp điện mặt trời hòa lưới</strong> và hàng trăm công trình cho hộ gia đình, doanh nghiệp trên khắp các tỉnh thành. Dưới đây là một số dự án tiêu biểu mà chúng tôi đã thực hiện.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.map((category, index) => (
        <section key={category.id} id={category.id} className={`py-16 ${index % 2 === 0 ? 'bg-[#F0F7FB]' : 'bg-white'}`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              
              {/* Info Side */}
              <div className="md:w-1/3 space-y-6">
                <div className="w-16 h-1 bg-[#80BF49] rounded-full"></div>
                <h3 className="text-3xl font-bold text-[#13426E]">{category.title}</h3>
                <p className="text-gray-700 leading-relaxed">{category.desc}</p>
                <Link href={`/du-an/${category.id}`} className="inline-flex items-center gap-2 text-[#80BF49] font-bold hover:text-[#13426E] transition-colors">
                  Xem tất cả dự án <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Grid Side */}
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.projects.map((project, idx) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
                    <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                      <Image src={project.image_url || "/doi.png"} alt={project.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-[#13426E]/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="p-4 border-t-4 border-[#80BF49]">
                      <h4 className="font-bold text-[#13426E] mb-2 line-clamp-1">{project.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>
      ))}

      {/* Stats Section */}
      <section className="py-20 relative text-white text-center">
         <Image src="/doi.png" alt="Thống kê dự án" fill className="object-cover" />
         <div className="absolute inset-0 bg-[#13426E]/90"></div>
         <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl font-bold uppercase mb-12">Năng Lực Triển Khai Thực Tế</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-5xl font-bold text-[#80BF49] mb-2">113.5</div>
                <div className="text-xl">MWp Điện Mặt Trời</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#80BF49] mb-2">2689+</div>
                <div className="text-xl">Hộ Gia Đình</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#80BF49] mb-2">226+</div>
                <div className="text-xl">Doanh Nghiệp</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-[#80BF49] mb-2">50+</div>
                <div className="text-xl">Tỉnh Thành</div>
              </div>
            </div>
         </div>
      </section>
    </>
  );
}
