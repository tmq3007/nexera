"use client";

import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/api/content.api";

export interface ProductSaleConfig {
  sale_mode?: string | null;
  saleMode?: string | null;
  price_display?: string | null;
  priceDisplay?: string | null;
}

export function useEcommerceConfig() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["business-info-ecommerce"],
    queryFn: () => contentApi.getBusinessInfo(),
    staleTime: 60 * 1000,
  });

  const ecommerceEnabled = data?.ecommerce_enabled ?? true;

  const canBuyProduct = (product?: ProductSaleConfig | null): boolean => {
    if (!product) return ecommerceEnabled;
    const mode = product.sale_mode || product.saleMode || "inherit";
    if (mode === "consult_only") return false;
    if (mode === "buyable") return true;
    return ecommerceEnabled;
  };

  const isContactPrice = (product?: ProductSaleConfig | null): boolean => {
    if (!product) return false;
    const pd = product.price_display || product.priceDisplay || "show";
    return pd === "contact";
  };

  return {
    ecommerceEnabled,
    canBuyProduct,
    isContactPrice,
    isLoading,
    refetch,
  };
}
