import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat.api';
import { useAuth } from '@/contexts/AuthContext';
import type { GetConversationParams } from '@/types/models/chat';

export const chatKeys = {
  all: ['chat'] as const,
  conversation: (params: GetConversationParams) => [...chatKeys.all, 'conversation', params] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
  adminConversations: () => [...chatKeys.all, 'admin', 'conversations'] as const,
  adminInfo: (authUserId: string) => [...chatKeys.all, 'admin', 'info', authUserId] as const,
  customerDetails: (customerId: string) => [...chatKeys.all, 'admin', 'customer', customerId] as const,
};

export function useConversation(params: GetConversationParams) {
  return useQuery({
    queryKey: chatKeys.conversation(params),
    queryFn: () => chatApi.getConversation(params),
    enabled: !!params.guestSessionId,
  });
}

export function useChatMessages(conversationId: string) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000, // poll for new messages every 5s
  });
}

export function useAdminConversations() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: chatKeys.adminConversations(),
    queryFn: () => chatApi.getAdminConversations(accessToken!),
    enabled: !!accessToken,
    refetchInterval: 10000, // refresh admin conversations every 10s
  });
}

export function useAdminInfo(authUserId: string) {
  return useQuery({
    queryKey: chatKeys.adminInfo(authUserId),
    queryFn: () => chatApi.getAdminInfo(authUserId),
    enabled: !!authUserId,
  });
}
