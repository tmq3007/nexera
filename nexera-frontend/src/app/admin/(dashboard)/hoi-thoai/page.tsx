export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { LiveChatManager } from "@/components/admin/LiveChatManager";

export default async function AdminLiveChatPage() {
  const supabase = await createClient();

  // Load initial conversations
  let { data: conversations, error } = await supabase
    .from("conversations")
    .select("*, customer:customers(id, full_name, email, phone, phone_numbers, emails, address, tier)")
    .order("last_message_at", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false });
    conversations = fallback.data as any;
  }

  return (
    <div className="h-full flex flex-col">
      <LiveChatManager initialConversations={conversations || []} />
    </div>
  );
}
