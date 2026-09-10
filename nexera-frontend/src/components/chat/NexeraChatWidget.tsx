"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Phone, 
  Clock,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  ShoppingBag,
  Minus,
  User,
  CheckCircle2,
  PhoneCall
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/client";
import { playNotificationChime, playSendFeedback } from "@/lib/audio-chime";

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
  onUnreadChange?: (count: number, lastMessage?: string) => void;
}

const QUICK_PROMPTS = [
  "Tư vấn điện mặt trời áp mái gia đình",
  "Báo giá pin lưu trữ & biến tần Inverter",
  "Chính sách bảo hành & bảo trì kỹ thuật",
  "Tra cứu tiến độ xử lý đơn hàng",
];

export function NexeraChatWidget({ isOpen, onClose, onUnreadChange }: NexeraChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [contactSaved, setContactSaved] = useState<boolean>(false);
  const [dismissedLeadCard, setDismissedLeadCard] = useState<boolean>(false);
  const [isAdminTyping, setIsAdminTyping] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadCountRef = useRef<number>(0);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingSentRef = useRef<boolean>(false);
  const activeChannelRef = useRef<any>(null);
  const supabase = createClient();

  // Load sound setting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nexera_chat_sound_muted");
    if (saved === "true") setIsSoundMuted(true);
  }, []);

  const toggleSound = () => {
    setIsSoundMuted((prev) => {
      const next = !prev;
      localStorage.setItem("nexera_chat_sound_muted", String(next));
      return next;
    });
  };

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      unreadCountRef.current = 0;
      onUnreadChange?.(0);
      scrollToBottom();
    }
  }, [isOpen, messages, onUnreadChange]);

  // Initialize or fetch session & existing conversation on mount
  useEffect(() => {
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

      // 2. Check if logged-in customer OR admin account
      let currentCustomerId: string | null = null;
      let currentCustomerName: string = "";

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [custRes, adminRes] = await Promise.all([
          supabase
            .from("customers")
            .select("id, full_name, phone, email, phone_numbers, emails, auth_user_id")
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
            .limit(1),
          supabase
            .from("admin_accounts")
            .select("id, display_name, email, role")
            .eq("auth_user_id", user.id)
            .maybeSingle()
        ]);

        const adminAcc = adminRes.data;
        const cust = custRes.data && custRes.data.length > 0 ? custRes.data[0] : null;

        if (adminAcc) {
          const adminTitle = adminAcc.display_name || user.email?.split("@")[0] || "Quản trị viên";
          const fullAdminName = `${adminTitle} (Quản trị viên)`;
          currentCustomerName = fullAdminName;
          
          if (isMounted) {
            setIsAdmin(true);
            setCustomerName(fullAdminName);
            setGuestName(fullAdminName);
            setGuestEmail(adminAcc.email || user.email || "");
            setContactSaved(true); // Admin không bao giờ cần hiển thị form hỏi lại SĐT
          }

          // Cập nhật tên các cuộc hội thoại cũ nếu đang gắn session này
          await supabase
            .from("conversations")
            .update({ 
              guest_name: fullAdminName,
              guest_email: adminAcc.email || user.email || undefined
            })
            .eq("guest_session_id", sId);
        } else if (cust) {
          currentCustomerId = cust.id;
          currentCustomerName = cust.full_name || "Khách hàng";
          if (isMounted) {
            setCustomerId(cust.id);
            setCustomerName(currentCustomerName);
            setGuestName(currentCustomerName);
            setGuestEmail(cust.email || user.email || "");
            if (cust.phone) setGuestPhone(cust.phone);
            setContactSaved(true);
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
        .neq("status", "MERGED") // Bỏ qua các hội thoại rác đã bị gộp
        .order("last_message_at", { ascending: false }) // Ưu tiên hội thoại mới có tin nhắn nhất (hội thoại cũ sau khi gộp sẽ nảy lên đây)
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
        // DO NOT create initial conversation yet, wait until first message is sent
        const welcomeMsg: ChatMessage = {
          id: "welcome_init",
          conversation_id: "local_welcome",
          sender_type: "SYSTEM",
          sender_name: "Nexera Support",
          content: "Xin chào! Rất vui được đón tiếp Quý khách đến với NEXERA. Bạn đang quan tâm đến giải pháp Năng lượng xanh, Thiết bị thông minh hay cần hỗ trợ đơn hàng ạ?",
          is_read: true,
          created_at: new Date().toISOString()
        };
        if (isMounted) {
          setMessages([welcomeMsg]);
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
  }, [supabase]);

  // Realtime subscription for new messages and typing events
  useEffect(() => {
    if (!conversationId) return;

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

          if (newMsg.sender_type === "ADMIN") {
            setIsAdminTyping(false);
            if (!isSoundMuted) {
              playNotificationChime();
            }
            if (!isOpen) {
              unreadCountRef.current += 1;
              onUnreadChange?.(unreadCountRef.current, newMsg.content);
            }
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          if (payload.payload?.sender === "ADMIN") {
            setIsAdminTyping(!!payload.payload?.isTyping);
          }
        }
      )
      .on(
        "broadcast",
        { event: "CONVERSATION_MERGED" },
        async (payload) => {
          const newConvId = payload.payload.newConversationId;
          if (newConvId) {
            setConversationId(newConvId);
            
            // Tự động fetch lại tin nhắn của cuộc hội thoại cũ vừa được gộp
            const { data: msgData } = await supabase
              .from("chat_messages")
              .select("*")
              .eq("conversation_id", newConvId)
              .order("created_at", { ascending: true });
              
            if (msgData) {
              setMessages(msgData as ChatMessage[]);
            }
          }
        }
      )
      .subscribe();

    activeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      activeChannelRef.current = null;
    };
  }, [conversationId, isOpen, isSoundMuted, supabase, onUnreadChange]);

  // Typing event handler for customer
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (conversationId && activeChannelRef.current) {
      if (!isTypingSentRef.current) {
        activeChannelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { sender: "CUSTOMER", isTyping: true }
        });
        isTypingSentRef.current = true;
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (activeChannelRef.current) {
          activeChannelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: { sender: "CUSTOMER", isTyping: false }
          });
        }
        isTypingSentRef.current = false;
      }, 1500);
    }
  };

  // Image upload and paste handlers
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, WebP)!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa là 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        handleSendMessage("[Hình ảnh]", [
          {
            type: "image",
            url: dataUrl,
            name: file.name
          }
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
      e.target.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  };

  // Send message handler (supports text and attachments)
  const handleSendMessage = async (textToSend?: string, attachmentsToSend?: any[]) => {
    const text = (textToSend !== undefined ? textToSend : inputValue).trim();
    if ((!text && (!attachmentsToSend || attachmentsToSend.length === 0)) || isSending) return;

    setIsSending(true);
    setInputValue("");

    // Stop typing immediately when sending
    if (activeChannelRef.current) {
      activeChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { sender: "CUSTOMER", isTyping: false }
      });
    }
    isTypingSentRef.current = false;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    playSendFeedback();

    const senderName = customerName || guestName || (isAdmin ? "Quản trị viên" : "Khách hàng");
    const finalContent = text || (attachmentsToSend?.[0]?.type === "image" ? "[Hình ảnh]" : "[Đính kèm]");

    try {
      let currentConvId = conversationId;

      // CREATE CONVERSATION ON FIRST MESSAGE IF IT DOESN'T EXIST
      if (!currentConvId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            customer_id: customerId,
            guest_session_id: guestSessionId,
            guest_name: customerName || guestName || (isAdmin ? "Quản trị viên" : "Khách vãng lai"),
            guest_phone: guestPhone || null,
            guest_email: guestEmail || null,
            status: "OPEN",
            last_message_preview: finalContent.length > 80 ? finalContent.substring(0, 77) + "..." : finalContent,
            last_message_at: new Date().toISOString(),
            unread_admin_count: 1,
            unread_customer_count: 0
          })
          .select()
          .single();
          
        if (convError || !newConv) {
          throw convError;
        }
        currentConvId = newConv.id;
        setConversationId(currentConvId);
      }

      // Optimistic message
      const tempId = "temp_" + Date.now();
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversation_id: currentConvId as string,
        sender_type: "CUSTOMER",
        sender_id: customerId,
        sender_name: senderName,
        content: finalContent,
        attachments: attachmentsToSend || [],
        is_read: false,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev.filter(m => m.id !== "welcome_init"), optimisticMsg]);

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: currentConvId as string,
          sender_type: "CUSTOMER",
          sender_id: customerId,
          sender_name: senderName,
          content: finalContent,
          attachments: attachmentsToSend || [],
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
            last_message_preview: finalContent.length > 80 ? finalContent.substring(0, 77) + "..." : finalContent,
            last_message_at: new Date().toISOString(),
            status: "OPEN"
          })
          .eq("id", currentConvId);
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[65] sm:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed bottom-3 sm:bottom-5 right-3 sm:right-6 left-3 sm:left-auto z-[70] w-auto sm:w-[410px] h-[540px] max-h-[calc(100dvh-7rem)] sm:max-h-[min(560px,calc(100dvh-7.5rem))] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(19,66,110,0.35)] border border-[#d4e6f1]/90 flex flex-col overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#13426e] via-[#164b7d] to-[#1e5a92] text-white px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between shadow-xs select-none">
          <div className="flex items-center gap-2.5 min-w-0 pr-1">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25 font-black text-xs text-[#80bf49] shadow-inner">
                NX
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#80bf49] border-2 border-[#13426e] rounded-full">
                <span className="w-full h-full rounded-full bg-[#80bf49] animate-ping block opacity-75" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-[13px] sm:text-sm tracking-tight whitespace-nowrap">
                  Tư vấn viên NEXERA
                </h3>
                <span className="inline-flex items-center text-[9px] bg-[#80bf49]/25 text-[#9ad166] px-1.5 py-0.5 rounded-md font-semibold border border-[#80bf49]/30">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-white/75 truncate mt-0.5">Hỗ trợ kỹ thuật & báo giá 24/7</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <a
              href={`tel:${siteConfig.company.phone.replace(/\D/g, '')}`}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              title={`Gọi Hotline: ${siteConfig.company.phone}`}
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
            <a
              href={`https://zalo.me/${siteConfig.company.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-1.5 py-1 text-white/90 hover:text-white hover:bg-white/15 rounded-lg text-[10px] font-bold transition-colors"
              title="Nhắn tin qua Zalo"
            >
              Zalo
            </a>
            <button
              onClick={toggleSound}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title={isSoundMuted ? "Bật âm thanh chuông báo" : "Tắt âm thanh chuông báo"}
            >
              {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Admin Identity Badge */}
        {isAdmin && (
          <div className="bg-[#13426e]/8 border-b border-[#13426e]/15 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-[#13426e] shrink-0 select-none">
            <span className="font-semibold flex items-center gap-1.5 truncate pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#13426e] animate-pulse shrink-0" />
              <span className="truncate">Tài khoản: {customerName}</span>
            </span>
            <span className="text-[9px] bg-[#13426e] text-white px-2 py-0.5 rounded-md font-bold shrink-0 tracking-wider">
              ADMIN
            </span>
          </div>
        )}

        {/* Guest Contact Bar (Collapsible) */}
        {showContactForm && (
          <div className="bg-gradient-to-b from-[#f0f7fb] to-[#e4f1f9] border-b border-[#d4e6f1] p-3.5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#13426e] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#80bf49]" />
                Để lại thông tin để chuyên viên gọi lại:
              </span>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white/50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleSaveContact} className="space-y-2">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Họ và tên của bạn..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] shadow-2xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="Số điện thoại..."
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] shadow-2xs"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email (không bắt buộc)..."
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] shadow-2xs"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#80bf49] hover:bg-[#9ad166] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
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
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                    {/* Attachments rendering */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att: any, attIdx: number) => {
                          if (att.type === "product") {
                            return (
                              <div
                                key={attIdx}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:border-[#80bf49] transition-all text-gray-800"
                              >
                                {att.image && (
                                  <div className="h-28 w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                                    <img src={att.image} alt={att.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="p-2.5">
                                  <h4 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight">
                                    {att.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="font-bold text-xs text-[#e11d48]">
                                      {new Intl.NumberFormat("vi-VN").format(att.sale_price || att.price)} đ
                                    </span>
                                    {att.sale_price && att.sale_price < att.price && (
                                      <span className="text-[10px] text-gray-400 line-through">
                                        {new Intl.NumberFormat("vi-VN").format(att.price)} đ
                                      </span>
                                    )}
                                  </div>
                                  {att.slug && (
                                    <a
                                      href={`/san-pham/${att.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 block w-full py-1 bg-[#13426e] hover:bg-[#1e5a92] text-white text-[10px] font-semibold text-center rounded-lg transition-colors"
                                    >
                                      Xem chi tiết sản phẩm →
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (att.type === "image") {
                            return (
                              <div
                                key={attIdx}
                                className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border border-gray-100 max-w-[220px]"
                                onClick={() => setSelectedLightboxImage(att.url)}
                                title="Nhấp để xem ảnh to"
                              >
                                <img src={att.url} alt={att.name || "Hình ảnh"} className="w-full h-auto max-h-[180px] object-cover" />
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    )}

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
                <p className="text-[11px] text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#80bf49]" />
                  Gợi ý chủ đề hỗ trợ nhanh:
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs bg-white hover:bg-[#f0f7fb] hover:text-[#13426e] hover:border-[#80bf49] text-gray-700 px-3.5 py-2.5 rounded-2xl border border-gray-200/80 transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform">{prompt}</span>
                      <span className="text-gray-300 group-hover:text-[#80bf49] transition-colors text-xs font-bold">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Conversational Lead Capture */}
            {!contactSaved && !customerId && !dismissedLeadCard && messages.some(m => m.sender_type === "CUSTOMER") && (
              <div className="my-2.5 p-3.5 bg-gradient-to-br from-[#f0f7fb] via-[#eaf4fa] to-[#e0f0f9] border border-[#bcdbf1] rounded-2xl shadow-xs animate-in fade-in duration-300 relative">
                <button
                  type="button"
                  onClick={() => setDismissedLeadCard(true)}
                  className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
                  title="Để lại sau"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-start gap-2.5 mb-2.5 pr-6">
                  <div className="w-7 h-7 rounded-xl bg-[#13426e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                    NX
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#13426e]">Để Nexera tư vấn bạn chu đáo nhất:</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                      Bạn để lại Tên & Số điện thoại để chuyên viên gửi báo giá & thông số qua Zalo nhé!
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSaveContact} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Họ và tên..."
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full text-xs pl-8 pr-2.5 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] shadow-2xs"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="Số điện thoại / Zalo..."
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full text-xs pl-8 pr-2.5 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] shadow-2xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!guestPhone.trim()}
                    className="w-full py-2 bg-gradient-to-r from-[#80bf49] to-[#6ea93e] hover:from-[#9ad166] hover:to-[#80bf49] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận gửi thông tin
                  </button>
                </form>
              </div>
            )}

            {/* Admin Typing Indicator */}
            {isAdminTyping && (
              <div className="flex items-end gap-2 justify-start animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-full bg-[#13426e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                  NX
                </div>
                <div className="bg-white text-gray-600 border border-gray-100 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-2xs">
                  <span className="text-[11px] text-gray-500 font-medium">Tư vấn viên đang soạn tin</span>
                  <span className="flex gap-1 items-center ml-1">
                    <span className="w-1.5 h-1.5 bg-[#80bf49] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#80bf49] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#80bf49] rounded-full animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        {/* Subtle fallback prompt only if user dismissed the inline card */}
        {!contactSaved && !customerId && dismissedLeadCard && !showContactForm && (
          <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500 bg-[#f0f7fb] px-3 py-1.5 rounded-xl border border-[#d4e6f1]/80 animate-in fade-in duration-200">
            <span>Cần tư vấn trực tiếp qua điện thoại?</span>
            <button
              onClick={() => setShowContactForm(true)}
              className="text-[#13426e] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Phone className="w-3 h-3 text-[#80bf49]" />
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
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-xl text-gray-400 hover:text-[#13426e] hover:bg-[#f0f7fb] flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Gửi hình ảnh đính kèm (hoặc dán Ctrl+V)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Nhập tin nhắn (hỗ trợ dán ảnh Ctrl+V)..."
            value={inputValue}
            onChange={handleInputChange}
            onPaste={handlePaste}
            disabled={isSending || isLoading}
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#80bf49]/30 focus:border-[#80bf49] focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending || isLoading}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#80bf49] to-[#6ea93e] hover:from-[#9ad166] hover:to-[#80bf49] disabled:opacity-40 disabled:hover:from-[#80bf49] disabled:hover:to-[#6ea93e] text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
            title="Gửi tin nhắn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Image Lightbox Modal */}
      {selectedLightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1.5 rounded-full bg-white/10 transition-colors cursor-pointer"
              title="Đóng ảnh"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedLightboxImage}
              alt="Chi tiết ảnh"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  </>
  );
}
