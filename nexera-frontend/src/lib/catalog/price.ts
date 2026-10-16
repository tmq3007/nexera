export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 2
  }).format(amount);
}

export function getProductPriceInfo(product: any) {
  const originalPrice = Number(product?.price || 0);
  const discountRate = Number(product?.discount_rate || 0);
  const discountedPrice = discountRate > 0
    ? originalPrice * (1 - discountRate / 100)
    : originalPrice;
  const hasDiscount = discountRate > 0 && discountedPrice < originalPrice;

  return {
    originalPrice,
    discountRate,
    discountedPrice,
    hasDiscount,
  };
}
