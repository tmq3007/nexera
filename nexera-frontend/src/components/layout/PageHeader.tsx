import Image from "next/image";

interface PageHeaderProps {
  title: string;
  breadcrumb?: string;
}

export function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <div className="relative w-full h-[250px] md:h-[350px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <Image
        src="/doi.png"
        alt={title}
        fill
        className="object-cover object-center"
        priority
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#13426E]/70"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-wider mb-4">
          {title}
        </h1>
        {breadcrumb && (
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm md:text-base font-medium">
            <span>Trang chủ</span>
            <span>/</span>
            <span className="text-[#80BF49]">{breadcrumb}</span>
          </div>
        )}
      </div>
    </div>
  );
}
