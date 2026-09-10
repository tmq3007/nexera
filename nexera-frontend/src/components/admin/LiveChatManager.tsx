"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  Volume2,
  VolumeX,
  PanelRightClose,
  PanelRightOpen,
  ShoppingBag,
  Image as ImageIcon,
  Paperclip,
  X,
  Zap
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { playNotificationChime, playSendFeedback } from "@/lib/audio-chime";

interface Conversation {
  id: string;
  customer_id?: string | null;
  guest_session_id?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED" | "MERGED";
  assigned_admin_id?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  unread_admin_count: number;
  unread_customer_count: number;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    phone_numbers?: string[] | null;
    emails?: string[] | null;
    address?: string | null;
    tier?: string | null;
  } | null;
}

interface Message {
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

interface CustomerNote {
  id: string;
  customer_id: string;
  admin_id?: string | null;
  content: string;
  created_at: string;
}

const CANNED_RESPONSES = [
  "Dạ chào Quý khách! Nexera có thể hỗ trợ thông tin gì cho bạn ạ?",
  "Hệ thống điện mặt trời hòa lưới có lưu trữ (Hybrid) hiện đang có chính sách bảo hành 5 năm toàn diện.",
  "Dạ kỹ sư tư vấn của Nexera sẽ liên hệ trực tiếp qua số điện thoại của bạn ngay ạ.",
  "Nexera cam kết cung cấp thiết bị chính hãng đầy đủ CO/CQ và hỗ trợ khảo sát tận nơi miễn phí.",
];

const SLASH_TEMPLATES = [
  { cmd: "/chao", title: "Chào khách hàng", text: "Xin chào Quý khách! NEXERA có thể hỗ trợ gì cho bạn hôm nay ạ?" },
  { cmd: "/baohanh", title: "Chính sách bảo hành", text: "Sản phẩm tại NEXERA được bảo hành chính hãng từ 24-36 tháng, cam kết 1 đổi 1 trong 30 ngày nếu có lỗi kỹ thuật." },
  { cmd: "/stk", title: "Thông tin thanh toán", text: "Thông tin chuyển khoản: Ngân hàng MB Bank - STK: 123456789 - Chủ TK: CÔNG TY NEXERA VIỆT NAM." },
  { cmd: "/giaohang", title: "Chính sách giao hàng", text: "NEXERA miễn phí giao hàng toàn quốc cho đơn từ 2 triệu đồng. Thời gian giao hàng từ 1-3 ngày làm việc." },
  { cmd: "/showroom", title: "Địa chỉ showroom", text: "Kính mời Quý khách ghé trải nghiệm showroom NEXERA tại Hà Nội. Mở cửa từ 8h00 - 21h00 hàng ngày." },
  { cmd: "/tuvan", title: "Hỏi nhu cầu chi tiết", text: "Quý khách vui lòng cho Nexera xin nhu cầu công suất hoặc model đang quan tâm để kỹ thuật viên tư vấn giải pháp tối ưu nhất ạ!" },
];

export function LiveChatManager({
  initialConversations = [],
}: {
  initialConversations?: Conversation[];
}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string; name: string }>({
    id: "",
    name: "Admin Nexera",
  });

  // Customer context states
  const [customerOrdersCount, setCustomerOrdersCount] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isConvertingGuest, setIsConvertingGuest] = useState(false);
  
  const [convertPhone, setConvertPhone] = useState("");
  const [convertEmail, setConvertEmail] = useState("");

  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(true);

  // Product Selector Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Image upload & Lightbox
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slash commands menu (/)
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const activeChannelRef = useRef<any>(null);
  const isTypingSentRef = useRef<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || null;

  // 1. Get current Admin user info
  useEffect(() => {
    async function loadAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: adminAcc } = await supabase
          .from("admin_accounts")
          .select("id, display_name")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        setAdminUser({
          id: adminAcc?.id || user.id,
          name: adminAcc?.display_name || user.email?.split("@")[0] || "Admin Nexera",
        });
      }
    }
    loadAdmin();
  }, [supabase]);

  // 2. Fetch or sync conversations
  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, customer:customers(id, full_name, email, phone, phone_numbers, emails, address, tier)")
      .order("last_message_at", { ascending: false });

    if (!error && data) {
      setConversations(data as Conversation[]);
      if (!selectedConvId && data.length > 0) {
        setSelectedConvId(data[0].id);
      }
    }
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel("admin_conversations_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            if (!isSoundMuted) playNotificationChime();
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isSoundMuted]);

  // 3. Load messages when selectedConvId changes
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      setIsCustomerTyping(false);
      return;
    }

    let isMounted = true;

    async function loadMessages() {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", selectedConvId)
        .order("created_at", { ascending: true });

      if (isMounted) {
        if (!error && data) {
          setMessages(data as Message[]);
        }
        setIsLoadingMessages(false);
      }

      await supabase
        .from("conversations")
        .update({ unread_admin_count: 0 })
        .eq("id", selectedConvId);
    }

    loadMessages();

    // Dùng chung channel "chat_messages_${selectedConvId}" với Storefront widget để trao đổi broadcast typing
    const channel = supabase
      .channel(`chat_messages_${selectedConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_type === "CUSTOMER") {
            setIsCustomerTyping(false);
            if (!isSoundMuted) {
              playNotificationChime();
            }
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          if (payload.payload?.sender === "CUSTOMER") {
            setIsCustomerTyping(!!payload.payload?.isTyping);
          }
        }
      )
      .subscribe();

    activeChannelRef.current = channel;

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      activeChannelRef.current = null;
    };
  }, [selectedConvId, supabase, isSoundMuted]);

  // 4. Load Customer Context (Orders and Notes)
  useEffect(() => {
    if (!activeConversation?.customer_id) {
      setCustomerOrdersCount(0);
      setCustomerNotes([]);
      return;
    }

    async function loadContext() {
      const cId = activeConversation!.customer_id!;

      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", cId);
      setCustomerOrdersCount(count || 0);

      const { data: notes } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", cId)
        .order("created_at", { ascending: false });
      setCustomerNotes((notes as CustomerNote[]) || []);
    }

    loadContext();
  }, [activeConversation?.customer_id, supabase]);

  // Sync guest convert inputs
  useEffect(() => {
    if (activeConversation && !activeConversation.customer_id) {
      setConvertPhone(activeConversation.guest_phone || "");
      setConvertEmail(activeConversation.guest_email || "");
    } else {
      setConvertPhone("");
      setConvertEmail("");
    }
  }, [selectedConvId, activeConversation?.customer_id, activeConversation?.guest_phone, activeConversation?.guest_email]);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing event handler for Admin & Slash command detection
  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val.startsWith("/")) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }

    if (selectedConvId && activeChannelRef.current) {
      if (!isTypingSentRef.current) {
        activeChannelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { sender: "ADMIN", isTyping: true },
        });
        isTypingSentRef.current = true;
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (activeChannelRef.current) {
          activeChannelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: { sender: "ADMIN", isTyping: false },
          });
        }
        isTypingSentRef.current = false;
      }, 1500);
    }
  };

  // Handle Send Message as Admin (supports attachments)
  const handleSendMessage = async (textToSend?: string, attachmentsToSend?: any[]) => {
    const text = (textToSend !== undefined ? textToSend : inputValue).trim();
    if ((!text && (!attachmentsToSend || attachmentsToSend.length === 0)) || isSending || !selectedConvId) return;

    setIsSending(true);
    setInputValue("");
    setShowSlashMenu(false);

    // Cancel typing broadcast immediately when sending
    if (activeChannelRef.current) {
      activeChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { sender: "ADMIN", isTyping: false },
      });
    }
    isTypingSentRef.current = false;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    playSendFeedback();

    const finalContent = text || (attachmentsToSend?.[0]?.type === "image" ? "[Hình ảnh]" : "[Đính kèm]");

    const tempId = "temp_" + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: selectedConvId,
      sender_type: "ADMIN",
      sender_id: adminUser.id || null,
      sender_name: adminUser.name,
      content: finalContent,
      attachments: attachmentsToSend || [],
      is_read: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: selectedConvId,
          sender_type: "ADMIN",
          sender_id: adminUser.id || null,
          sender_name: adminUser.name,
          content: finalContent,
          attachments: attachmentsToSend || [],
          is_read: true,
        })
        .select()
        .single();

      if (!error && data) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as Message) : m)));

        await supabase
          .from("conversations")
          .update({
            last_message_preview: finalContent.length > 80 ? finalContent.substring(0, 77) + "..." : finalContent,
            last_message_at: new Date().toISOString(),
            unread_customer_count: (activeConversation?.unread_customer_count || 0) + 1,
            status: "OPEN",
          })
          .eq("id", selectedConvId);

        fetchConversations();
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn admin:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Product selector modal handlers
  const handleOpenProductModal = async () => {
    setIsProductModalOpen(true);
    if (catalogProducts.length === 0) {
      setIsLoadingProducts(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, price, sale_price, images, thumbnail, slug, stock, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) {
        setCatalogProducts(data);
      }
      setIsLoadingProducts(false);
    }
  };

  const handleSendProduct = (product: any) => {
    const productAttachment = {
      type: "product",
      id: product.id,
      name: product.name,
      price: product.price,
      sale_price: product.sale_price,
      image: product.images?.[0] || product.thumbnail,
      slug: product.slug,
    };
    handleSendMessage(`[Sản phẩm] ${product.name}`, [productAttachment]);
    setIsProductModalOpen(false);
  };

  // Image upload & paste handlers for Admin
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
            name: file.name,
          },
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

  const handleSelectSlashCommand = (cmd: typeof SLASH_TEMPLATES[0]) => {
    setInputValue(cmd.text);
    setShowSlashMenu(false);
  };

  // Toggle conversation status
  const handleToggleStatus = async () => {
    if (!activeConversation) return;
    const newStatus = activeConversation.status === "RESOLVED" ? "OPEN" : "RESOLVED";

    await supabase.from("conversations").update({ status: newStatus }).eq("id", activeConversation.id);

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, status: newStatus } : c))
    );
  };

  // Add customer note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeConversation?.customer_id) return;

    setIsSavingNote(true);
    const cId = activeConversation.customer_id;

    const { data, error } = await supabase
      .from("customer_notes")
      .insert({
        customer_id: cId,
        admin_id: adminUser.id || null,
        content: newNoteContent.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setCustomerNotes((prev) => [data as CustomerNote, ...prev]);
      setNewNoteContent("");
    }
    setIsSavingNote(false);
  };

  // Convert Guest to Customer
  const handleConvertGuest = async () => {
    if (!activeConversation || activeConversation.customer_id) return;
    
    const phone = convertPhone.trim();
    const email = convertEmail.trim();

    if (!phone) {
      alert("Vui lòng nhập số điện thoại để chuyển thành khách hàng!");
      return;
    }

    setIsConvertingGuest(true);

    const fullName = activeConversation.guest_name || "Khách hàng tư vấn";

    try {
      // 1. Kiểm tra xem SĐT hoặc Email đã tồn tại chưa
      let existingCustomer = null;
      
      let query = supabase.from("customers").select("id, phone_numbers, emails").limit(1);
      
      if (phone && email) {
        query = query.or(`phone.eq.${phone},email.eq.${email}`);
      } else if (phone) {
        query = query.eq("phone", phone);
      } else if (email) {
        query = query.eq("email", email);
      }

      const { data: custData, error: searchError } = await query;
      if (!searchError && custData && custData.length > 0) {
        existingCustomer = custData[0];
      }

      let mergedIntoOldConvId = null;
      let customerIdToLink = null;

      if (existingCustomer) {
        // Khách đã tồn tại -> Cập nhật thông tin nếu thiếu và link
        customerIdToLink = existingCustomer.id;
        
        const updates: any = {};
        const phoneNumbers = existingCustomer.phone_numbers || [];
        const emails = existingCustomer.emails || [];

        if (phone && !phoneNumbers.includes(phone)) {
          updates.phone_numbers = [...phoneNumbers, phone];
        }
        if (email && !emails.includes(email)) {
          updates.emails = [...emails, email];
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("customers").update(updates).eq("id", customerIdToLink);
        }

        // Kiểm tra xem khách này đã có hội thoại cũ chưa
        const { data: oldConvs } = await supabase
          .from("conversations")
          .select("id, last_message_at")
          .eq("customer_id", customerIdToLink)
          .order("last_message_at", { ascending: false })
          .limit(1);

        if (oldConvs && oldConvs.length > 0) {
          mergedIntoOldConvId = oldConvs[0].id;
        }
      } else {
        // Tạo khách hàng mới
        const { data: newCustomer, error: custError } = await supabase
          .from("customers")
          .insert({
            full_name: fullName,
            phone: phone,
            email: email || null,
            phone_numbers: phone ? [phone] : [],
            emails: email ? [email] : [],
            tier: "POTENTIAL",
            notes: `Tạo tự động từ cuộc hội thoại trực tiếp #${activeConversation.id.substring(0, 8)}`,
          })
          .select()
          .single();

        if (custError || !newCustomer) {
          throw custError || new Error("Failed to create customer");
        }
        customerIdToLink = newCustomer.id;
      }

      if (mergedIntoOldConvId) {
        // Chuyển toàn bộ tin nhắn từ hội thoại mới sang hội thoại cũ
        const { error: moveMsgError } = await supabase
          .from("chat_messages")
          .update({ conversation_id: mergedIntoOldConvId })
          .eq("conversation_id", activeConversation.id);
          
        if (moveMsgError) console.error("Lỗi khi chuyển tin nhắn:", moveMsgError);

        // Cập nhật last_message_at và guest_session_id cho hội thoại cũ
        await supabase
          .from("conversations")
          .update({ 
            last_message_at: activeConversation.last_message_at,
            last_message_preview: activeConversation.last_message_preview,
            guest_session_id: activeConversation.guest_session_id, // Link session cũ của khách vào hội thoại này
            unread_admin_count: 1, // Đánh dấu chưa đọc để admin chú ý
            status: "OPEN" // Mở lại hội thoại cũ nếu đang đóng
          })
          .eq("id", mergedIntoOldConvId);

        // Phát Broadcast báo cho Storefront widget biết để chuyển sang hội thoại cũ
        const channel = supabase.channel(`chat_messages_${activeConversation.id}`);
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: "broadcast",
              event: "CONVERSATION_MERGED",
              payload: { newConversationId: mergedIntoOldConvId }
            });
            supabase.removeChannel(channel);
          }
        });


        // Ẩn hội thoại rác mới tạo bằng cách đổi status thành MERGED (do RLS không cho phép DELETE)
        await supabase
          .from("conversations")
          .update({ status: "MERGED" })
          .eq("id", activeConversation.id);

        // Đổi view sang hội thoại cũ
        setSelectedConvId(mergedIntoOldConvId);
      } else {
        // Link conversation hiện tại với customer
        await supabase
          .from("conversations")
          .update({ customer_id: customerIdToLink })
          .eq("id", activeConversation.id);
      }

      await fetchConversations();
    } catch (err) {
      console.error("Lỗi chuyển đổi khách hàng:", err);
      alert("Có lỗi xảy ra khi chuyển đổi khách hàng!");
    } finally {
      setIsConvertingGuest(false);
    }
  };

  // Đặt làm số chính từ khung chat
  const handleSetPrimaryPhone = async (newPhone: string) => {
    if (!activeConversation?.customer_id) return;
    await supabase
      .from("customers")
      .update({ phone: newPhone })
      .eq("id", activeConversation.customer_id);
    fetchConversations();
  };

  // Đặt làm email chính từ khung chat
  const handleSetPrimaryEmail = async (newEmail: string) => {
    if (!activeConversation?.customer_id) return;
    await supabase
      .from("customers")
      .update({ email: newEmail })
      .eq("id", activeConversation.customer_id);
    fetchConversations();
  };

  // Cập nhật tên tài khoản chính theo tên người đang chat
  const handleUpdateAccountName = async (newName: string) => {
    if (!activeConversation?.customer_id || !newName.trim()) return;
    await supabase
      .from("customers")
      .update({ full_name: newName.trim() })
      .eq("id", activeConversation.customer_id);
    fetchConversations();
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Lọc bỏ các cuộc hội thoại rỗng hoặc đã bị gộp
    if (conv.last_message_preview === "Bắt đầu cuộc trò chuyện mới") return false;
    if (conv.status === "MERGED") return false;

    const name = conv.customer?.full_name || conv.guest_name || "Khách vãng lai";
    const phone = conv.customer?.phone || conv.guest_phone || "";
    const email = conv.customer?.email || conv.guest_email || "";
    const preview = conv.last_message_preview || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preview.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "OPEN") {
      return conv.status === "OPEN" || conv.status === "PENDING";
    }
    if (statusFilter === "RESOLVED") {
      return conv.status === "RESOLVED";
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)] bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
      {/* ===================== CỘT 1: DANH SÁCH HỘI THOẠI ===================== */}
      <div className="w-80 md:w-88 border-r border-gray-200/80 flex flex-col bg-gray-50/40 shrink-0">
        {/* Header & Search */}
        <div className="p-3.5 border-b border-gray-200/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Hội thoại tư vấn</h2>
            <span className="text-[11px] font-semibold text-gray-500">
              {conversations.length} hội thoại
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, tin nhắn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400 text-gray-800"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 py-1 font-medium rounded-md transition-all ${
                statusFilter === "ALL" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter("OPEN")}
              className={`flex-1 py-1 font-medium rounded-md transition-all ${
                statusFilter === "OPEN" ? "bg-white text-[#13426e] shadow-2xs font-semibold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Đang mở
            </button>
            <button
              onClick={() => setStatusFilter("RESOLVED")}
              className={`flex-1 py-1 font-medium rounded-md transition-all ${
                statusFilter === "RESOLVED" ? "bg-white text-gray-700 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Đã xử lý
            </button>
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              <p>Không có cuộc hội thoại nào.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const displayName = conv.customer?.full_name || conv.guest_name || "Khách vãng lai";
              const isRegistered = !!conv.customer_id;
              const hasUnread = conv.unread_admin_count > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-3 transition-colors flex items-start gap-3 relative ${
                    isSelected
                      ? "bg-white border-l-4 border-l-[#13426e] shadow-2xs"
                      : "hover:bg-white/60"
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs text-gray-900 truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 truncate mb-1">
                      {conv.last_message_preview || "Cuộc hội thoại mới"}
                    </p>

                    <div className="flex items-center gap-2 text-[10px]">
                      {displayName.includes("(Quản trị viên)") || displayName.includes("(Admin)") ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          Quản trị viên
                        </span>
                      ) : (
                        <span className={`font-medium ${isRegistered ? "text-blue-700" : "text-gray-500"}`}>
                          {isRegistered ? "Thành viên" : "Vãng lai"}
                        </span>
                      )}

                      {conv.status === "RESOLVED" && (
                        <span className="text-gray-400">· Đã giải quyết</span>
                      )}

                      {hasUnread && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_admin_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ===================== CỘT 2: CỬA SỔ CHAT TRUNG TÂM ===================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {activeConversation.customer?.full_name ||
                      activeConversation.guest_name ||
                      "Khách vãng lai"}
                  </h3>
                  {activeConversation.customer &&
                    activeConversation.guest_name &&
                    activeConversation.guest_name !== "Khách vãng lai" &&
                    activeConversation.guest_name !== activeConversation.customer.full_name && (
                      <span className="text-[10px] text-gray-500">
                        (Người chat: <strong>{activeConversation.guest_name}</strong>)
                      </span>
                    )}
                  <span
                    className={`text-xs font-semibold ${
                      activeConversation.status === "RESOLVED"
                        ? "text-gray-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {activeConversation.status === "RESOLVED" ? "· Đã giải quyết" : "· Đang mở"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {activeConversation.customer?.phone || activeConversation.guest_phone ? (
                    <span className="font-mono">
                      {activeConversation.customer?.phone || activeConversation.guest_phone}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">Chưa có số điện thoại</span>
                  )}
                </p>
              </div>

              {/* Actions & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSoundMuted(!isSoundMuted)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                  title={isSoundMuted ? "Bật âm thanh chuông báo" : "Tắt âm thanh chuông báo"}
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                </button>
                <button
                  onClick={() => setIsCrmOpen(!isCrmOpen)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                  title={isCrmOpen ? "Thu gọn hồ sơ CRM" : "Mở rộng hồ sơ CRM"}
                >
                  {isCrmOpen ? <PanelRightClose className="w-4 h-4 text-[#13426e]" /> : <PanelRightOpen className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  onClick={handleToggleStatus}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  {activeConversation.status === "RESOLVED" ? "Mở lại hội thoại" : "Đánh dấu đã giải quyết"}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  <span>Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Chưa có tin nhắn nào trong cuộc trò chuyện này.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdmin = msg.sender_type === "ADMIN";
                  const isSystem = msg.sender_type === "SYSTEM";

                  if (isSystem) {
                    return (
                      <div key={msg.id || idx} className="flex justify-center my-2">
                        <span className="text-[11px] bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full shadow-2xs">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex items-end gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-[#13426e] text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-0.5">
                          <span
                            className={`text-[10px] font-semibold ${
                              isAdmin ? "text-emerald-300" : "text-gray-500"
                            }`}
                          >
                            {msg.sender_name}
                          </span>
                          <span
                            className={`text-[9px] ${
                              isAdmin ? "text-white/60" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                        {/* Attachments rendering */}
                        {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((att: any, attIdx: number) => {
                              if (att.type === "product") {
                                return (
                                  <div
                                    key={attIdx}
                                    className="bg-white text-gray-800 rounded-xl border border-gray-200 overflow-hidden shadow-xs p-2.5 max-w-[260px]"
                                  >
                                    {att.image && (
                                      <div className="h-24 w-full bg-gray-50 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                                        <img src={att.image} alt={att.name} className="w-full h-full object-cover" />
                                      </div>
                                    )}
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
                                );
                              }

                              if (att.type === "image") {
                                return (
                                  <div
                                    key={attIdx}
                                    className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border border-gray-100 max-w-[220px]"
                                    onClick={() => setSelectedLightboxImage(att.url)}
                                    title="Nhấp để phóng to ảnh"
                                  >
                                    <img src={att.url} alt={att.name || "Hình ảnh"} className="w-full h-auto max-h-[180px] object-cover" />
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Customer Typing Indicator */}
              {isCustomerTyping && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium py-1 animate-in fade-in duration-150">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Khách hàng đang soạn tin nhắn...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Canned Responses / Quick Replies */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/70 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
              <span className="text-gray-400 font-medium shrink-0">
                Mẫu trả lời:
              </span>
              {CANNED_RESPONSES.map((res, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(res)}
                  className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition-colors shrink-0"
                >
                  {res.length > 32 ? res.substring(0, 30) + "..." : res}
                </button>
              ))}
            </div>

            {/* Slash Command Quick Templates Popup */}
            {showSlashMenu && (
              <div className="mx-3 mb-1 p-2 bg-white rounded-xl shadow-xl border border-gray-200 animate-in slide-in-from-bottom-2 duration-150 z-20">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 mb-1.5">
                  <span className="text-[11px] font-bold text-[#13426e] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Mẫu trả lời nhanh (Phím tắt /)
                  </span>
                  <button
                    onClick={() => setShowSlashMenu(false)}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {SLASH_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSlashCommand(tmpl)}
                      className="text-left p-2 rounded-lg hover:bg-[#f0f7fb] hover:border-[#80bf49] border border-transparent transition-all group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-[#13426e] group-hover:text-[#80bf49]">
                          {tmpl.title}
                        </span>
                        <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-semibold">
                          {tmpl.cmd}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{tmpl.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-gray-200 bg-white flex items-center gap-2 shrink-0"
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
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-[#13426e] hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
                title="Gửi hình ảnh đính kèm (hoặc dán Ctrl+V)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleOpenProductModal}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-[#13426e] hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
                title="Chọn sản phẩm từ kho để gửi thẻ tư vấn"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="Nhập câu trả lời (Gõ / để chọn mẫu nhanh, dán ảnh Ctrl+V)..."
                value={inputValue}
                onChange={handleAdminInputChange}
                onPaste={handlePaste}
                disabled={isSending}
                className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400 focus:bg-white text-gray-800"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="px-4 py-2 rounded-lg bg-[#13426e] hover:bg-[#1e5a92] disabled:opacity-40 text-white text-xs font-semibold transition-all shrink-0"
              >
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs">
            <p>Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu chat.</p>
          </div>
        )}
      </div>

      {/* ===================== CỘT 3: HỒ SƠ NGỮ CẢNH KHÁCH HÀNG (CRM) ===================== */}
      {activeConversation && isCrmOpen && (
        <div className="w-72 md:w-80 border-l border-gray-200 flex flex-col bg-white shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
              Hồ sơ khách hàng (CRM)
            </h3>

            {/* User Profile Info */}
            <div className="pb-3 border-b border-gray-100 space-y-1">
              <h4 className="font-bold text-sm text-gray-900">
                {activeConversation.customer?.full_name ||
                  activeConversation.guest_name ||
                  "Khách vãng lai"}
              </h4>

              {activeConversation.customer &&
                activeConversation.guest_name &&
                activeConversation.guest_name !== "Khách vãng lai" &&
                activeConversation.guest_name !== activeConversation.customer.full_name && (
                  <div className="p-1.5 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
                    <span className="truncate mr-1">
                      Tên khi chat: <strong>{activeConversation.guest_name}</strong>
                    </span>
                    <button
                      onClick={() => handleUpdateAccountName(activeConversation.guest_name!)}
                      className="text-[10px] font-semibold text-blue-700 hover:underline shrink-0"
                      title="Cập nhật tên tài khoản theo tên người đang chat"
                    >
                      Đổi tên chính
                    </button>
                  </div>
                )}

              <p className="text-xs mt-1">
                {activeConversation.customer ? (
                  <span className="font-medium text-emerald-600">Thành viên chính thức</span>
                ) : (
                  <span className="text-amber-600">Khách vãng lai từ website</span>
                )}
              </p>

              {/* Phân hạng */}
              {activeConversation.customer && (
                <p className="text-xs text-gray-600">
                  Phân hạng: <strong className="text-gray-900">{activeConversation.customer.tier || "TIÊU CHUẨN"}</strong>
                </p>
              )}
            </div>

            {/* Contact details */}
            <div className="mt-3 space-y-3 text-xs">
              {/* PHẦN SỐ ĐIỆN THOẠI */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 block">
                  Số điện thoại ({activeConversation.customer?.phone_numbers?.length || (activeConversation.customer?.phone || activeConversation.guest_phone ? 1 : 0)}):
                </span>

                {activeConversation.customer ? (
                  <div className="space-y-1">
                    {Array.from(
                      new Set([
                        ...(activeConversation.customer.phone ? [activeConversation.customer.phone] : []),
                        ...(Array.isArray(activeConversation.customer.phone_numbers) ? activeConversation.customer.phone_numbers : []),
                      ])
                    ).map((p) => {
                      const isPrimary = p === activeConversation.customer?.phone;
                      return (
                        <div key={p} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-gray-900">{p}</span>
                            {isPrimary && (
                              <span className="text-[10px] text-emerald-700 font-bold">(Chính)</span>
                            )}
                          </div>
                          {!isPrimary && (
                            <button
                              onClick={() => handleSetPrimaryPhone(p)}
                              className="text-[10px] text-emerald-700 hover:underline font-medium"
                            >
                              Đặt làm chính
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {activeConversation.guest_phone &&
                      activeConversation.guest_phone !== activeConversation.customer.phone && (
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 flex items-center justify-between">
                          <span>
                            Chat từ số: <strong className="font-mono">{activeConversation.guest_phone}</strong>
                          </span>
                          <button
                            onClick={() => handleSetPrimaryPhone(activeConversation.guest_phone!)}
                            className="text-[10px] font-semibold text-blue-700 underline"
                          >
                            Đổi số chính
                          </button>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-gray-700 bg-gray-50 p-2 rounded">
                    <span className="font-mono">{activeConversation.guest_phone || "Chưa có số điện thoại"}</span>
                  </div>
                )}
              </div>

              {/* PHẦN EMAIL */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 block">
                  Email ({activeConversation.customer?.emails?.length || (activeConversation.customer?.email || activeConversation.guest_email ? 1 : 0)}):
                </span>

                {activeConversation.customer ? (
                  <div className="space-y-1">
                    {Array.from(
                      new Set([
                        ...(activeConversation.customer.email ? [activeConversation.customer.email] : []),
                        ...(Array.isArray(activeConversation.customer.emails) ? activeConversation.customer.emails : []),
                      ])
                    ).map((e) => {
                      const isPrimary = e === activeConversation.customer?.email;
                      return (
                        <div key={e} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          <div className="flex items-center gap-1.5 truncate mr-2">
                            <span className="text-gray-900 truncate">{e}</span>
                            {isPrimary && (
                              <span className="text-[10px] text-blue-700 font-bold shrink-0">(Chính)</span>
                            )}
                          </div>
                          {!isPrimary && (
                            <button
                              onClick={() => handleSetPrimaryEmail(e)}
                              className="text-[10px] text-blue-700 hover:underline font-medium shrink-0"
                            >
                              Đặt làm chính
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {activeConversation.guest_email &&
                      activeConversation.guest_email !== activeConversation.customer.email && (
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 flex items-center justify-between">
                          <span className="truncate mr-1">
                            Chat từ: <strong className="truncate">{activeConversation.guest_email}</strong>
                          </span>
                          <button
                            onClick={() => handleSetPrimaryEmail(activeConversation.guest_email!)}
                            className="text-[10px] font-semibold text-blue-700 underline shrink-0"
                          >
                            Đổi email chính
                          </button>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-gray-700 bg-gray-50 p-2 rounded">
                    <span className="truncate">{activeConversation.guest_email || "Chưa có email"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Convert to Customer Form for Guest */}
            {!activeConversation.customer && (
              <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-100">
                <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Tạo mới / Liên kết Khách hàng
                </h4>
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    value={convertPhone}
                    onChange={(e) => setConvertPhone(e.target.value)}
                    placeholder="Số điện thoại (*)"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-[#13426e] focus:border-[#13426e] outline-none"
                  />
                  <input
                    type="email"
                    value={convertEmail}
                    onChange={(e) => setConvertEmail(e.target.value)}
                    placeholder="Email (không bắt buộc)"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-[#13426e] focus:border-[#13426e] outline-none"
                  />
                </div>
                <button
                  onClick={handleConvertGuest}
                  disabled={isConvertingGuest}
                  className="w-full py-1.5 px-3 bg-[#13426e] hover:bg-[#1e5a92] disabled:bg-gray-400 text-white rounded text-xs font-semibold transition-colors"
                >
                  {isConvertingGuest ? "Đang xử lý..." : "Chuyển thành Khách hàng"}
                </button>
              </div>
            )}
          </div>

          {/* Orders summary */}
          {activeConversation.customer && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">Đơn hàng đã đặt</span>
                <span className="text-xs font-bold text-gray-900">{customerOrdersCount} đơn</span>
              </div>
              <a
                href={`/admin/don-hang?customer_id=${activeConversation.customer_id}`}
                className="text-xs text-[#13426e] hover:underline"
              >
                Xem chi tiết đơn hàng
              </a>
            </div>
          )}

          {/* CRM Notes */}
          <div className="p-4 flex-1 flex flex-col">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Ghi chú chăm sóc
            </h4>

            {activeConversation.customer_id ? (
              <>
                <form onSubmit={handleAddNote} className="mb-3">
                  <textarea
                    placeholder="Thêm ghi chú về nhu cầu, cuộc gọi tư vấn..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400 focus:bg-white resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={!newNoteContent.trim() || isSavingNote}
                      className="px-2.5 py-1 bg-[#13426e] hover:bg-[#1e5a92] text-white text-[11px] font-medium rounded-md transition-colors"
                    >
                      {isSavingNote ? "Đang lưu..." : "Lưu ghi chú"}
                    </button>
                  </div>
                </form>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-48">
                  {customerNotes.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">Chưa có ghi chú nào.</p>
                  ) : (
                    customerNotes.map((note) => (
                      <div key={note.id} className="p-2 bg-gray-50 rounded-md border border-gray-100 text-xs">
                        <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        <span className="text-[9px] text-gray-400 block mt-1">
                          {new Date(note.created_at).toLocaleDateString("vi-VN")}{" "}
                          {new Date(note.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-gray-400 italic">
                Chuyển khách vãng lai thành Khách hàng để lưu ghi chú CRM.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {isProductModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#13426e]/10 text-[#13426e] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Chọn sản phẩm tư vấn từ kho</h3>
                  <p className="text-[11px] text-gray-500">Gửi thẻ sản phẩm trực tiếp vào khung chat</p>
                </div>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#80bf49]"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {isLoadingProducts ? (
                <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#80bf49]" />
                  <span>Đang tải danh sách sản phẩm...</span>
                </div>
              ) : catalogProducts.filter((p) => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Không tìm thấy sản phẩm nào phù hợp.
                </div>
              ) : (
                catalogProducts
                  .filter((p) => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                  .map((product) => {
                    const img = product.images?.[0] || product.thumbnail;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#80bf49] hover:bg-[#f0f7fb]/40 transition-all group"
                      >
                        <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                          {img ? (
                            <img src={img} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-xs text-[#e11d48]">
                              {new Intl.NumberFormat("vi-VN").format(product.sale_price || product.price)} đ
                            </span>
                            {product.sale_price && product.sale_price < product.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                {new Intl.NumberFormat("vi-VN").format(product.price)} đ
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 ml-auto">
                              Kho: {product.stock ?? 0}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendProduct(product)}
                          className="px-3 py-1.5 bg-[#13426e] hover:bg-[#1e5a92] text-white text-xs font-medium rounded-lg transition-colors shrink-0 shadow-xs"
                        >
                          Gửi vào chat
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedLightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1.5 rounded-full bg-white/10 transition-colors"
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
  );
}
