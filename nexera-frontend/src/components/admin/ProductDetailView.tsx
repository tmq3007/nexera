import { Zap, Tag, Box, Info, ShieldCheck, Globe, DollarSign, Image as ImageIcon } from "lucide-react";

export function ProductDetailView({ product }: { product: any }) {
  if (!product) return null;

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
      {/* Left: Image */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-4 overflow-hidden">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <span>Chưa có hình ảnh</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center text-center">
            <span className="text-blue-500 text-xs font-semibold mb-1">Loại hình</span>
            <span className="text-blue-800 font-bold text-sm">{product.type === "EQUIPMENT" ? "Thiết bị" : "Trọn gói"}</span>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col items-center text-center">
            <span className="text-green-600 text-xs font-semibold mb-1">Tồn kho</span>
            <span className="text-green-800 font-bold text-sm">{product.stock}</span>
          </div>
        </div>
      </div>

      {/* Right: Details */}
      <div className="w-full md:w-2/3 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#13426E] mb-2">{product.name}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {(product.categories as { name: string } | null)?.name || "Chưa phân loại"}</span>
            <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {product.origin || "Chưa cập nhật"}</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {product.warranty_info || "Chưa cập nhật"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Giá bán</div>
            <div className="text-xl font-bold text-[#E30019]">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Thương hiệu</div>
            <div className="text-lg font-bold text-gray-800">
              {product.brand || "Chưa cập nhật"}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Mô tả sản phẩm</h3>
          <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
            {product.description || "Chưa có mô tả."}
          </p>
        </div>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2"><Box className="w-4 h-4" /> Thông số kỹ thuật</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
              <table className="w-full text-left">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <th className="px-4 py-2 font-medium text-gray-700 border-b border-gray-100 w-1/3">{key}</th>
                      <td className="px-4 py-2 text-gray-600 border-b border-gray-100">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
