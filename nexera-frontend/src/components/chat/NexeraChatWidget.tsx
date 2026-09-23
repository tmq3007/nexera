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
  PhoneCall,
  MessageSquarePlus
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/client";
import { playNotificationChime, playSendFeedback } from "@/lib/audio-chime";
import { chatApi } from "@/lib/api/chat.api";

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

const formatChatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch {
    return "";
  }
};

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
  const [customerTier, setCustomerTier] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showPromptsMenu, setShowPromptsMenu] = useState<boolean>(false);
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
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150); // Đợi 150ms để DOM render xong các block lớn (như form)
  };

  useEffect(() => {
    if (isOpen) {
      unreadCountRef.current = 0;
      onUnreadChange?.(0);
      scrollToBottom();
    }
  }, [isOpen, messages, onUnreadChange]);

  // Initialize or fetch session & existing conversation on mount (Backend-First)
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      setIsLoading(true);

      // 1. Kiểm tra mã phiên vãng lai từ localStorage
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

      // 2. Lấy thông tin user đăng nhập (nếu có)
      const { data: { user } } = await supabase.auth.getUser();

      const welcomeMsg: ChatMessage = {
        id: "welcome_init",
        conversation_id: "local_welcome",
        sender_type: "SYSTEM",
        sender_name: "Nexera Support",
        content: "Xin chào! Rất vui được đón tiếp Quý khách đến với NEXERA. Bạn đang quan tâm đến giải pháp Năng lượng xanh, Thiết bị thông minh hay cần hỗ trợ đơn hàng ạ?",
        is_read: true,
        created_at: new Date().toISOString()
      };

      try {
        // 3. Gọi Backend API duy nhất: Lấy đúng hội thoại và toàn bộ tin nhắn xuyên suốt
        const res = await chatApi.getConversation({
          guestSessionId: sId,
          authUserId: user?.id,
          email: user?.email,
        });

        if (isMounted) {
          if (res.customer) {
            setCustomerId(res.customer.id || null);
            setCustomerTier(res.customer.tier || "TIÊU CHUẨN");
            setCustomerName(res.customer.full_name || "Khách hàng");
            setGuestName(res.customer.full_name || "Khách hàng");
            if (res.customer.email) setGuestEmail(res.customer.email);
            if (res.customer.phone) setGuestPhone(res.customer.phone);
            setContactSaved(true);
          }

          if (res.conversation) {
            setConversationId(res.conversation.id);
            if (res.messages && res.messages.length > 0) {
              setMessages(res.messages as ChatMessage[]);
            } else {
              setMessages([welcomeMsg]);
            }
          } else {
            setConversationId(null);
            setMessages([welcomeMsg]);
          }
          setIsLoading(false);
          scrollToBottom();
        }
      } catch (err) {
        console.error("Lỗi lấy hội thoại từ Backend API:", err);
        if (isMounted) {
          setMessages([welcomeMsg]);
          setIsLoading(false);
        }
      }
    }

    initChat();

    // Lắng nghe sự kiện auth để tự động đồng bộ & nạp lại chat ngay khi khách đăng nhập/đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "SIGNED_OUT") {
        initChat();
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

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
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          const updatedConv = payload.new as any;
          if (updatedConv.guest_name && updatedConv.guest_name !== "Khách vãng lai") {
            setCustomerName(updatedConv.guest_name);
            setGuestName(updatedConv.guest_name);
          }
          if (updatedConv.customer_id) {
            setCustomerId(updatedConv.customer_id);
            setContactSaved(true);
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

            // Tự động nạp lại tin nhắn của cuộc hội thoại vừa được gộp qua Backend API
            try {
              const msgs = await chatApi.getMessages(newConvId);
              if (msgs) {
                setMessages(msgs as ChatMessage[]);
              }
            } catch (err) {
              console.error("Lỗi lấy tin nhắn sau khi gộp:", err);
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
  // Send message handler (Backend-First API)
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

    // Optimistic UI
    const tempId = "temp_" + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: conversationId || "temp_conv",
      sender_type: "CUSTOMER",
      sender_id: customerId,
      sender_name: senderName,
      content: finalContent,
      attachments: attachmentsToSend || [],
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev.filter(m => m.id !== "welcome_init"), optimisticMsg]);

    try {
      // Gửi tin nhắn qua NestJS Backend API
      const res = await chatApi.sendMessage({
        conversationId: conversationId || undefined,
        guestSessionId: guestSessionId,
        content: finalContent,
        attachments: attachmentsToSend || [],
        senderType: "CUSTOMER",
        senderName: senderName,
        senderId: customerId || undefined,
      });

      if (res.success) {
        if (!conversationId && res.conversationId) {
          setConversationId(res.conversationId);
        }
        // Thay thế optimistic message bằng tin nhắn chính thức từ DB
        setMessages((prev) => prev.map((m) => (m.id === tempId ? (res.message as ChatMessage) : m)));
      }
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn qua Backend API:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Save guest contact info (Backend-First API)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestName.trim();
    const phone = guestPhone.trim();
    const email = guestEmail.trim();
    if (!name && !phone && !email) return;

    localStorage.setItem("nexera_chat_guest_name", name);
    localStorage.setItem("nexera_chat_guest_phone", phone);
    localStorage.setItem("nexera_chat_guest_email", email);
    setContactSaved(true);
    setShowContactForm(false);

    try {
      const res = await chatApi.identifyContact({
        guestSessionId,
        conversationId: conversationId || undefined,
        fullName: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });

      if (res.customer) {
        setCustomerId(res.customer.id);
        if (res.customer.full_name) {
          setCustomerName(res.customer.full_name);
          setGuestName(res.customer.full_name);
        }
      }
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
    } catch (err) {
      console.error("Lỗi lưu thông tin liên hệ qua Backend API:", err);
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
        className={`fixed bottom-3 sm:bottom-5 right-3 sm:right-6 left-3 sm:left-auto z-[70] w-auto sm:w-[380px] h-[580px] sm:h-[620px] max-h-[calc(100dvh-7rem)] sm:max-h-[min(650px,calc(100dvh-7.5rem))] bg-white rounded-3xl shadow-2xl shadow-[#13426e]/20 border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-6 pointer-events-none"
          }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#13426e] via-[#164b7d] to-[#1e5a92] text-white px-4 py-4 flex items-center justify-between shadow-md select-none relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center gap-3 min-w-0 pr-1 relative z-10">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-[13px] text-[#13426e] shadow-sm ring-2 ring-white/30">
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

        {/* Customer Identity Badge on Storefront */}
        {!isAdmin && customerId && (
          <div className="bg-emerald-50/90 border-b border-emerald-100/80 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-emerald-800 shrink-0 select-none">
            <span className="font-semibold flex items-center gap-1.5 truncate pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">Tài khoản: <strong>{customerName}</strong></span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold tracking-wider">
                {customerTier || "THÀNH VIÊN"}
              </span>
            </div>
          </div>
        )}

        {/* Guest Identified Badge */}
        {!isAdmin && !customerId && contactSaved && guestName && (
          <div className="bg-blue-50/90 border-b border-blue-100/80 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-blue-800 shrink-0 select-none">
            <span className="font-semibold flex items-center gap-1.5 truncate pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span className="truncate">Khách hàng: <strong>{guestName}</strong></span>
            </span>
            <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold tracking-wider">
              KHÁCH TƯ VẤN
            </span>
          </div>
        )}

        {/* Guest Contact Bar (Collapsible) */}
        {showContactForm && !customerId && (
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
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isNewDay =
                  !prevMsg ||
                  (msg.created_at &&
                    prevMsg.created_at &&
                    new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString());

                if (isSystem) {
                  return (
                    <React.Fragment key={msg.id || index}>
                      {isNewDay && msg.created_at && (
                        <div className="flex items-center justify-center my-2 select-none">
                          <span className="text-[10px] bg-slate-200/80 text-gray-500 font-medium px-3 py-0.5 rounded-full shadow-2xs">
                            {formatChatDate(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-end gap-2 justify-start my-1 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#13426e] to-[#1e5a92] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm ring-2 ring-white">
                          NX
                        </div>
                        <div className="max-w-[85%] bg-white border border-[#e2e8f0] text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-[12.5px] shadow-sm leading-relaxed relative">
                          <p className="text-[10px] font-bold text-[#13426e] mb-1.5 opacity-90">
                            {msg.sender_name || "Nexera Support"}
                          </p>
                          {msg.content}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                return (
                  <React.Fragment key={msg.id || index}>
                    {isNewDay && msg.created_at && (
                      <div className="flex items-center justify-center my-2 select-none">
                        <span className="text-[10px] bg-slate-200/80 text-gray-500 font-medium px-3 py-0.5 rounded-full shadow-2xs">
                          {formatChatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-end gap-2 ${isCustomer ? "justify-end" : "justify-start"}`}
                    >
                      {!isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-[#13426e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                          NX
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${isCustomer
                            ? "bg-[#13426e] text-white rounded-br-xs"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
                          }`}
                      >
                        {!isCustomer ? (
                          <p className="text-[10px] font-bold text-[#80bf49] mb-1">
                            {(!msg.sender_name ||
                              msg.sender_name === "Khách Hàng Mặc Định" ||
                              msg.sender_name === "Khách hàng" ||
                              msg.sender_name === customerName ||
                              msg.sender_name === guestName)
                              ? "Tư vấn viên NEXERA"
                              : msg.sender_name}
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-emerald-300 mb-1">
                            {customerName || guestName || "Bạn"}
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
                          className={`text-[9px] block text-right mt-1 ${isCustomer ? "text-white/60" : "text-gray-400"
                            }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Quick Prompt Suggestions if few messages */}
              {!isAdmin && messages.length <= 2 && (
                <div className="pt-2">
                  <p className="text-[11px] text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#80bf49]" />
                    Gợi ý chủ đề hỗ trợ nhanh:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11.5px] font-medium bg-white hover:bg-[#80bf49] text-gray-600 hover:text-white px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-[#80bf49] transition-all shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        {prompt}
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

          {isAdmin ? (
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <p className="text-[11px] font-semibold text-red-500 mb-2">
                🚫 Bạn đang đăng nhập dưới quyền Quản trị viên. Bạn không thể tự gửi tin nhắn cho hệ thống.
              </p>
              <a
                href="/admin/hoi-thoai"
                className="px-4 py-2 bg-[#13426e] hover:bg-[#1e5a92] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
              >
                Chuyển đến Trang Quản trị
              </a>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 bg-white relative"
            >
              {/* Quick Prompts Button & Menu */}
              <div className="relative">
                {showPromptsMenu && (
                  <div className="absolute bottom-full left-0 mb-3 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[80] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="text-[11px] font-bold text-gray-500 px-2 pb-2 mb-1 border-b border-gray-100 flex items-center justify-between">
                      <span>Gợi ý câu hỏi:</span>
                      <button type="button" onClick={() => setShowPromptsMenu(false)} className="hover:text-gray-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleSendMessage(prompt);
                            setShowPromptsMenu(false);
                          }}
                          className="text-left text-[11.5px] px-3 py-2 text-gray-700 hover:bg-[#f0f7fb] hover:text-[#13426e] rounded-xl transition-colors cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowPromptsMenu(!showPromptsMenu)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${showPromptsMenu ? "bg-[#13426e] text-white shadow-md" : "text-gray-400 hover:text-[#13426e] hover:bg-slate-100"
                    }`}
                  title="Xem các câu hỏi gợi ý"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  disabled={isSending || isLoading}
                  className="w-full text-[13px] pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#13426e]/20 focus:border-[#13426e]/40 focus:bg-white text-gray-800 placeholder-gray-400 transition-all shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSending || isLoading}
                  className="absolute right-1 top-1 bottom-1 w-8 h-8 rounded-full bg-[#13426e] hover:bg-[#1a5b99] disabled:opacity-40 disabled:bg-gray-400 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  title="Gửi tin nhắn"
                >
                  <Send className="w-3.5 h-3.5 -ml-0.5" />
                </button>
              </div>
            </form>
          )}
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
