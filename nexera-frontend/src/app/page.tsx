import { HeroSlider } from "@/components/home/HeroSlider";
import { ContactForm } from "@/components/home/ContactForm";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Zap, PiggyBank, RefreshCcw, Banknote, House, FileCheck2, Cpu } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch latest 4 articles
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(4);

  return (
    <>
      <HeroSlider />

      {/* Tin tức Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
           <div className="flex flex-col items-center mb-12">
             <h2 className="text-3xl font-bold text-[#13426E] uppercase relative">
               Tin Tức Nexera
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#80BF49]"></div>
             </h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles?.map((article) => (
                 <Link href={`/tin-tuc/${article.id}`} key={article.id} className="group bg-[#F0F7FB] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow block">
                    <div className="aspect-[16/9] relative bg-gray-200">
                       <Image src={article.image_url || "/doi.png"} alt={article.title} fill className="object-cover" />
                       <div className="absolute inset-0 bg-[#13426E]/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="p-4">
                       <h3 className="font-bold text-[#13426E] mb-2 line-clamp-2 group-hover:text-[#80BF49] transition-colors">
                          {article.title}
                       </h3>
                       <p className="text-sm text-gray-600 line-clamp-3">
                          {article.content}
                       </p>
                    </div>
                 </Link>
              ))}
           </div>
           
           <div className="flex justify-center mt-8">
              <Link href="/tin-tuc" className="flex items-center gap-2 bg-[#13426E] text-white px-6 py-2 rounded-full hover:bg-[#80BF49] transition-colors font-medium">
                 Xem thêm <ChevronRight className="w-4 h-4" />
              </Link>
           </div>
        </div>
      </section>

      {/* Video & Info Section */}
      <section className="py-16 bg-[#F0F7FB]">
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div>
                  {/* YouTube Embed Placeholder */}
                  <div className="aspect-video bg-gray-300 rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center">
                     <Image src="/doi.png" alt="Video Giới Thiệu" fill className="object-cover" />
                     <span className="text-white z-10 font-bold text-lg">Video Giới Thiệu</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                     <div className="aspect-square relative rounded-lg overflow-hidden shadow">
                        <Image src="/doi.png" alt="Info 1" fill className="object-cover" />
                     </div>
                     <div className="aspect-square relative rounded-lg overflow-hidden shadow">
                        <Image src="/doi.png" alt="Info 2" fill className="object-cover" />
                     </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-[#80BF49]">NEXERA SOLAR</h2>
                  <p className="text-lg text-gray-700 text-justify">
                    <strong className="text-[#13426E]">Điện năng lượng mặt trời</strong> ngày càng khẳng định vai trò quan trọng trong phát triển kinh tế – xã hội, vừa đáp ứng nhu cầu <strong className="text-[#13426E]">sinh hoạt và sản xuất</strong>, vừa cân bằng giữa khai thác năng lượng và bảo vệ môi trường, hướng tới mục tiêu phát triển bền vững.
                  </p>
                  <p className="text-lg text-gray-700 text-justify">
                    <strong className="text-[#13426E]">NEXERA SOLAR</strong> tự hào là đơn vị <strong className="text-[#13426E]">lắp đặt điện mặt trời uy tín</strong>, tiên phong với thành tựu <strong className="text-[#13426E]">113,5 MWp điện mặt trời hòa lưới</strong> và hàng trăm MWp cho <strong className="text-[#13426E]">hộ gia đình và doanh nghiệp</strong> trên toàn quốc.
                  </p>
                  <Link href="/gioi-thieu" className="inline-flex items-center gap-2 bg-[#80BF49] text-white px-8 py-3 rounded-md hover:bg-[#13426E] transition-colors font-medium">
                    Tìm hiểu thêm <ChevronRight className="w-5 h-5" />
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* Dự Án Section */}
      <section className="py-16 bg-white relative">
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               
               {/* Hộ Gia Đình */}
               <div className="relative group rounded-xl overflow-hidden shadow-lg aspect-[4/3] md:aspect-[3/4] lg:aspect-square">
                  <Image src="/doi.png" alt="Hộ gia đình" fill className="object-cover" />
                  <div className="absolute inset-0 bg-[#13426E]/60 group-hover:bg-[#13426E]/80 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                     <h3 className="text-2xl font-bold mb-4">Dự án điện mặt trời cho hộ gia đình</h3>
                     <p className="mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-sm">
                        Phục vụ hơn 2689+ khách hàng ở hơn 50 tỉnh thành trên cả nước. Giải pháp linh hoạt và tối ưu.
                     </p>
                     <div className="grid grid-cols-2 gap-8 w-full border-t border-white/20 pt-8">
                        <div>
                           <div className="text-4xl font-bold text-[#80BF49]">2689+</div>
                           <div className="text-sm mt-2">Khách hàng hộ gia đình</div>
                        </div>
                        <div>
                           <div className="text-4xl font-bold text-[#80BF49]">TOÀN QUỐC</div>
                           <div className="text-sm mt-2">Mọi tỉnh thành</div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Doanh Nghiệp */}
               <div className="relative group rounded-xl overflow-hidden shadow-lg aspect-[4/3] md:aspect-[3/4] lg:aspect-square">
                  <Image src="/doi.png" alt="Doanh nghiệp" fill className="object-cover" />
                  <div className="absolute inset-0 bg-[#13426E]/60 group-hover:bg-[#13426E]/80 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                     <h3 className="text-2xl font-bold mb-4">Dự án điện mặt trời cho doanh nghiệp</h3>
                     <p className="mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-sm">
                        Sự lựa chọn hàng đầu cho tổ chức. Cam kết dịch vụ thi công và lắp đặt trọn gói chất lượng cao.
                     </p>
                     <div className="grid grid-cols-2 gap-8 w-full border-t border-white/20 pt-8">
                        <div>
                           <div className="text-4xl font-bold text-[#80BF49]">226+</div>
                           <div className="text-sm mt-2">Khách hàng doanh nghiệp</div>
                        </div>
                        <div>
                           <div className="text-4xl font-bold text-[#80BF49]">50MW+</div>
                           <div className="text-sm mt-2">Công suất lắp đặt</div>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* Lợi Ích & Form Liên Hệ Section */}
      <section className="py-16 bg-[#F0F7FB] text-[#13426E]">
         <div className="container mx-auto px-4">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-bold uppercase mb-2">GIẢI PHÁP LẮP ĐẶT ĐIỆN MẶT TRỜI</h2>
               <h3 className="text-4xl font-bold text-[#80BF49] uppercase">THÔNG MINH NEXERA SOLAR</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               
               {/* Lợi ích Grid */}
               <div className="lg:col-span-7">
                  <div className="aspect-[21/9] relative bg-gray-300 rounded-xl mb-8 overflow-hidden opacity-80 shadow-md">
                     <Image src="/doi.png" alt="Lợi ích" fill className="object-cover" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                     <div className="flex flex-col items-center text-center">
                        <PiggyBank className="w-12 h-12 text-[#80BF49] mb-3" />
                        <h4 className="font-bold">Tiết kiệm</h4>
                        <p className="text-sm text-gray-600 mt-1">lên đến 90%</p>
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <ShieldCheck className="w-12 h-12 text-[#80BF49] mb-3" />
                        <h4 className="font-bold">Chế độ bảo hành</h4>
                        <p className="text-sm text-gray-600 mt-1">vượt trội</p>
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <RefreshCcw className="w-12 h-12 text-[#80BF49] mb-3" />
                        <h4 className="font-bold">Thu hồi vốn</h4>
                        <p className="text-sm text-gray-600 mt-1">3 - 5 năm</p>
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <FileCheck2 className="w-12 h-12 text-[#80BF49] mb-3" />
                        <h4 className="font-bold">Thủ tục pháp lý</h4>
                        <p className="text-sm text-gray-600 mt-1">Nhanh chóng</p>
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <House className="w-12 h-12 text-[#80BF49] mb-3" />
                        <h4 className="font-bold">Thẩm mỹ</h4>
                        <p className="text-sm text-gray-600 mt-1">An toàn, đẹp mắt</p>
                     </div>
                     <div className="flex flex-col items-center text-center">
                        <Banknote className="w-12 h-12 text-[#80BF49] mb-3" />
                        <h4 className="font-bold">Hỗ trợ trả góp</h4>
                        <p className="text-sm text-gray-600 mt-1">lên đến 80%</p>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-5">
                  <ContactForm />
               </div>

            </div>
         </div>
      </section>

    </>
  );
}
