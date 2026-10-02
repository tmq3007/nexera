import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products.api';
import { useAuth } from '@/contexts/AuthContext';
import type { GetProductsQuery, CreateProductDto, UpdateProductDto } from '@/types/models/product';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (query: GetProductsQuery) => [...productKeys.lists(), query] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  bestsellers: () => [...productKeys.all, 'bestsellers'] as const,
};

export function useProducts(query: GetProductsQuery = {}) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => productsApi.getProducts(query),
  });
}

export function useProductDetail(slugOrId: string) {
  return useQuery({
    queryKey: productKeys.detail(slugOrId),
    queryFn: () => productsApi.getProductDetail(slugOrId),
    enabled: !!slugOrId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productsApi.getCategories(),
  });
}

export function useBestsellers(limit = 8) {
  return useQuery({
    queryKey: productKeys.bestsellers(),
    queryFn: () => productsApi.getBestsellers(limit),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: (data: CreateProductDto) =>
      productsApi.createProduct(data, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.updateProduct(id, data, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: (id: string) =>
      productsApi.deleteProduct(id, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
