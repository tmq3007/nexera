"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Phone, 
  Clock 
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: "CUSTOMER" | "ADMIN" | "SYSTEM";
  sender_id?: string | null;
  sender_name: string;
  content: string;
  attachments?: any;
  is_read: boolean;
  created_at: string;
}

interface NexeraChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Tư vấn điện mặt trời áp mái gia đình",
  "Báo giá pin lưu trữ & biến tần Inverter",
  "Chính sách bảo hành & bảo trì kỹ thuật",
  "Tra cứu tiến độ xử lý đơn hàng",
];

export function NexeraChatWidget({ isOpen, onClose }: NexeraChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [contactSaved, setContactSaved] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initialize or fetch session & existing conversation
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initChat() {
      setIsLoading(true);

      // 1. Check local guest session
      let sId = localStorage.getItem("nexera_chat_guest_session");
      if (!sId) {
        sId = "guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        localStorage.setItem("nexera_chat_guest_session", sId);
      }
      if (isMounted) setGuestSessionId(sId);

      const savedName = localStorage.getItem("nexera_chat_guest_name") || "";
      const savedPhone = localStorage.getItem("nexera_chat_guest_phone") || "";
      const savedEmail = localStorage.getItem("nexera_chat_guest_email") || "";
      if (isMounted) {
        setGuestName(savedName);
        setGuestPhone(savedPhone);
        setGuestEmail(savedEmail);
        if (savedName || savedPhone || savedEmail) setContactSaved(true);
      }

      // 2. Check if logged-in customer & Merge Multi-phone / Multi-email
      let currentCustomerId: string | null = null;
      let currentCustomerName: string = "";

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: custList } = await supabase
          .from("customers")
          .select("id, full_name, phone, email, phone_numbers, emails, auth_user_id")
          .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
          .limit(1);

        const cust = custList && custList.length > 0 ? custList[0] : null;

        if (cust) {
          currentCustomerId = cust.id;
          currentCustomerName = cust.full_name || "Khách hàng";
          if (isMounted) {
            setCustomerId(cust.id);
            setCustomerName(currentCustomerName);
          }

          if (cust.auth_user_id !== user.id) {
            await supabase.from("customers").update({ auth_user_id: user.id }).eq("id", cust.id);
          }

          // Tự động gom SĐT và Email từ phiên vãng lai vào mảng của khách hàng
          const updatedPhones: string[] = Array.isArray(cust.phone_numbers) ? [...cust.phone_numbers] : [];
          const updatedEmails: string[] = Array.isArray(cust.emails) ? [...cust.emails] : [];
          let needsUpdate = false;

          if (savedPhone && !updatedPhones.includes(savedPhone)) {
            updatedPhones.push(savedPhone);
            needsUpdate = true;
          }
          if (savedEmail && !updatedEmails.includes(savedEmail)) {
            updatedEmails.push(savedEmail);
            needsUpdate = true;
          }

          if (needsUpdate) {
            await supabase
              .from("customers")
              .update({
                phone: cust.phone || savedPhone || undefined,
                email: cust.email || savedEmail || undefined,
                phone_numbers: updatedPhones,
                emails: updatedEmails,
              })
              .eq("id", cust.id);
          }

          // Đồng bộ các hội thoại trước khi đăng nhập về customer_id này
          await supabase
            .from("conversations")
            .update({ customer_id: cust.id })
            .eq("guest_session_id", sId)
            .is("customer_id", null);
        }
      }

      // 3. Find existing conversation (tìm theo cả customer_id hoặc guest_session_id)
      let query = supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (currentCustomerId && sId) {
        query = query.or(`customer_id.eq.${currentCustomerId},guest_session_id.eq.${sId}`);
      } else if (currentCustomerId) {
        query = query.eq("customer_id", currentCustomerId);
      } else {
        query = query.eq("guest_session_id", sId);
      }

      const { data: convData } = await query;

      let conv = convData && convData.length > 0 ? convData[0] : null;

      if (!conv) {
        // Create initial conversation
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            customer_id: currentCustomerId,
            guest_session_id: sId,
            guest_name: savedName || (currentCustomerName || "Khách vãng lai"),
            guest_phone: savedPhone || null,
            guest_email: savedEmail || null,
            status: "OPEN",
            last_message_preview: "Bắt đầu cuộc trò chuyện mới",
            unread_admin_count: 0,
            unread_customer_count: 0
          })
          .select()
          .single();

        if (newConv) {
          conv = newConv;
        }
      }

      if (conv && isMounted) {
        setConversationId(conv.id);

        // Đảm bảo hội thoại đã được gắn customer_id nếu đã đăng nhập
        if (currentCustomerId && conv.customer_id !== currentCustomerId) {
          await supabase
            .from("conversations")
            .update({ customer_id: currentCustomerId })
            .eq("id", conv.id);
          conv.customer_id = currentCustomerId;
        }

        // Fetch messages for this conversation
        const { data: msgData } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });

        if (msgData && msgData.length > 0) {
          setMessages(msgData as ChatMessage[]);
        } else {
          // If no messages yet, show welcome system message
          const welcomeMsg: ChatMessage = {
            id: "welcome_init",
            conversation_id: conv.id,
            sender_type: "SYSTEM",
            sender_name: "Nexera Support",
            content: "Xin chào! Rất vui được đón tiếp Quý khách đến với NEXERA. Bạn đang quan tâm đến giải pháp Năng lượng xanh, Thiết bị thông minh hay cần hỗ trợ đơn hàng ạ?",
            is_read: true,
            created_at: new Date().toISOString()
          };
          setMessages([welcomeMsg]);
        }
      }

      if (isMounted) setIsLoading(false);
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [isOpen, supabase]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !isOpen) return;

    const channel = supabase
      .channel(`chat_messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isOpen, supabase]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending || !conversationId) return;

    setIsSending(true);
    setInputValue("");

    const senderName = customerName || guestName || "Khách hàng";

    // Optimistic message
    const tempId = "temp_" + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_type: "CUSTOMER",
      sender_id: customerId,
      sender_name: senderName,
      content: text,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "CUSTOMER",
          sender_id: customerId,
          sender_name: senderName,
          content: text,
          is_read: false
        })
        .select()
        .single();

      if (!error && data) {
        // Replace optimistic message
        setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as ChatMessage) : m)));

        // Update conversation summary
        await supabase
          .from("conversations")
          .update({
            last_message_preview: text.length > 80 ? text.substring(0, 77) + "..." : text,
            last_message_at: new Date().toISOString(),
            status: "OPEN"
          })
          .eq("id", conversationId);
      }
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Save guest contact info
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() && !guestPhone.trim() && !guestEmail.trim()) return;

    localStorage.setItem("nexera_chat_guest_name", guestName.trim());
    localStorage.setItem("nexera_chat_guest_phone", guestPhone.trim());
    localStorage.setItem("nexera_chat_guest_email", guestEmail.trim());
    setContactSaved(true);
    setShowContactForm(false);

    if (conversationId) {
      await supabase
        .from("conversations")
        .update({
          guest_name: guestName.trim() || undefined,
          guest_phone: guestPhone.trim() || undefined,
          guest_email: guestEmail.trim() || undefined,
        })
        .eq("id", conversationId);
    }

    // Nếu đã đăng nhập, tự động gom SĐT và Email vào mảng của khách hàng
    if (customerId) {
      const { data: cust } = await supabase
        .from("customers")
        .select("phone, email, phone_numbers, emails")
        .eq("id", customerId)
        .maybeSingle();

      if (cust) {
        const updatedPhones: string[] = Array.isArray(cust.phone_numbers) ? [...cust.phone_numbers] : [];
        const updatedEmails: string[] = Array.isArray(cust.emails) ? [...cust.emails] : [];
        let needsUpdate = false;

        if (guestPhone.trim() && !updatedPhones.includes(guestPhone.trim())) {
          updatedPhones.push(guestPhone.trim());
          needsUpdate = true;
        }
        if (guestEmail.trim() && !updatedEmails.includes(guestEmail.trim())) {
          updatedEmails.push(guestEmail.trim());
          needsUpdate = true;
        }

        if (needsUpdate) {
          await supabase
            .from("customers")
            .update({
              phone: cust.phone || guestPhone.trim() || undefined,
              email: cust.email || guestEmail.trim() || undefined,
              phone_numbers: updatedPhones,
              emails: updatedEmails,
            })
            .eq("id", customerId);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[390px] h-[540px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13426e] to-[#1e5a92] text-white p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 font-bold text-xs text-[#80bf49]">
              NX
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#80bf49] border-2 border-[#13426e] rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
              Tư vấn viên NEXERA
              <span className="text-[10px] bg-[#80bf49]/20 text-[#80bf49] px-1.5 py-0.5 rounded-full font-medium">Online</span>
            </h3>
            <p className="text-[11px] text-white/80">Hỗ trợ kỹ thuật & giải pháp 24/7</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowContactForm(!showContactForm)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Cập nhật số điện thoại & Email"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guest Contact Bar (Collapsible or Auto-prompt) */}
      {showContactForm && (
        <div className="bg-[#f0f7fb] border-b border-[#d4e6f1] p-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#13426e]">
              Để lại thông tin để chuyên viên gọi lại:
            </span>
            <button
              onClick={() => setShowContactForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <form onSubmit={handleSaveContact} className="space-y-2">
            <input
              type="text"
              placeholder="Họ và tên của bạn..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#80bf49]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="tel"
                placeholder="Số điện thoại..."
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#80bf49]"
              />
              <input
                type="email"
                placeholder="Email nhận báo giá..."
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#80bf49]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#80bf49] hover:bg-[#9ad166] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Lưu thông tin liên hệ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs gap-2">
            <Clock className="w-5 h-5 animate-spin text-[#80bf49]" />
            <span>Đang kết nối trung tâm tư vấn...</span>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isCustomer = msg.sender_type === "CUSTOMER";
              const isSystem = msg.sender_type === "SYSTEM";

              if (isSystem) {
                return (
                  <div key={msg.id || index} className="flex justify-center my-2">
                    <div className="bg-white border border-[#d4e6f1] text-[#13426e] rounded-xl px-3.5 py-2 text-xs shadow-2xs max-w-[90%] leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || index}
                  className={`flex items-end gap-2 ${isCustomer ? "justify-end" : "justify-start"}`}
                >
                  {!isCustomer && (
                    <div className="w-7 h-7 rounded-full bg-[#13426e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                      NX
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      isCustomer
                        ? "bg-[#13426e] text-white rounded-br-xs"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
                    }`}
                  >
                    {!isCustomer && (
                      <p className="text-[10px] font-bold text-[#80bf49] mb-1">
                        {msg.sender_name || "Tư vấn viên"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        isCustomer ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Quick Prompt Suggestions if few messages */}
            {messages.length <= 2 && (
              <div className="pt-2">
                <p className="text-[11px] text-gray-400 font-medium mb-2">
                  Gợi ý câu hỏi nhanh:
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs bg-white hover:bg-[#f0f7fb] hover:text-[#13426e] hover:border-[#80bf49] text-gray-700 px-3 py-2 rounded-xl border border-gray-200/80 transition-all shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-gray-100 shrink-0">
        {!contactSaved && !customerId && (
          <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500 bg-[#f0f7fb] px-2.5 py-1.5 rounded-lg border border-[#d4e6f1]/60">
            <span>Cần tư vấn trực tiếp qua điện thoại?</span>
            <button
              onClick={() => setShowContactForm(true)}
              className="text-[#13426e] font-semibold hover:underline flex items-center gap-0.5"
            >
              Để lại SĐT
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSending || isLoading}
            className="flex-1 text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#80bf49] focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending || isLoading}
            className="w-9 h-9 rounded-xl bg-[#80bf49] hover:bg-[#9ad166] disabled:opacity-40 disabled:hover:bg-[#80bf49] text-white flex items-center justify-center transition-all shadow-xs shrink-0"
            title="Gửi tin nhắn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
