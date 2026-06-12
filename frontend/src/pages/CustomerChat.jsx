import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import echo from "../echo";
import PaymentModal from "./PaymentModal";
import { IoSend } from "react-icons/io5";
import { FaQuestionCircle, FaComments, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { useParams, useNavigate } from 'react-router-dom';
import LoadingScreen from "../components/LoadingScreen";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useTabNotification } from "../hooks/useTabNotification";
import { useTheme } from "../hooks/useTheme";
import { useMessageSound } from "../hooks/useMessageSound";

const validateUserData = (storedUser, apiUser) => {
  if (!storedUser || !apiUser) return false;
  if (apiUser.role === 'admin') return false;
  if (storedUser.id !== apiUser.id) return false;
  if (storedUser.email !== apiUser.email) return false;
  return true;
};

export default function CustomerChat() {
  const { adminId: adminIdFromUrl } = useParams();
  const adminId = Number(adminIdFromUrl) || 1;

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [messageType, setMessageType] = useState("normal");
  const [wordCount, setWordCount] = useState(0);
  const [wordLimitError, setWordLimitError] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const [adminTyping, setAdminTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [adminOnline, setAdminOnline] = useState(false);
  const { setUnreadCount, clearNotification } = useTabNotification();
  const { isDark, toggleTheme } = useTheme();
  const { playSound, playOutgoingSound } = useMessageSound();

  // ── Session state ──
  // sessionRemaining = free normal messages left in the current session
  const [sessionRemaining, setSessionRemaining] = useState(3);
  const [sessionType, setSessionType] = useState('welcome'); // 'welcome' | 'active'
  const [lastAnswerId, setLastAnswerId] = useState(null);

  useOnlineStatus();

  // Theme
  const bg          = isDark ? "bg-[#0d0f14]" : "bg-gray-50";
  const sidebarBg   = isDark ? "bg-[#13151c]" : "bg-white";
  const headerBg    = isDark ? "bg-[#1a1d27]" : "bg-white";
  const inputBg     = isDark ? "bg-[#1a1d27]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-[#2a2d3a]" : "border-gray-200";
  const cardBg      = isDark ? "bg-[#1e2130]" : "bg-gray-50";

  const getDateLabel = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current)
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    };
    scrollToBottom();
    const t = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(t);
  }, [messages]);

  // ── Load user + messages on mount ──
  useEffect(() => {
    const loadUserAndMessages = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) { window.location.href = "/login"; return; }
      if (storedUser.role === 'admin') {
        localStorage.removeItem("user");
        alert("Admin users cannot access customer chat.");
        window.location.href = "/login";
        return;
      }
      setUser(storedUser);
      try {
        const userResponse = await API.get('/user');
        if (validateUserData(storedUser, userResponse.data)) {
          const updatedUser = {
            ...storedUser, ...userResponse.data,
            id: storedUser.id, email: storedUser.email,
            role: storedUser.role || 'customer',
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch {}
      await loadMessages(adminId);
    };
    loadUserAndMessages();
  }, []);

  // ── Admin online status ──
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const res = await API.get(`/status/${adminId}`);
        setAdminOnline(res.data.is_online);
      } catch { setAdminOnline(false); }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Visibility change ──
  useEffect(() => {
    if (!user) return;
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        clearNotification();
        try {
          const res = await API.get('/user');
          if (res.data) {
            const updatedUser = { ...res.data, role: res.data.role || 'customer' };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch {}
        const state = window.Echo?.connector?.pusher?.connection?.state;
        if (state !== 'connected') window.Echo?.connector?.pusher?.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // ── Load messages from API ──
  const loadMessages = async (targetAdminId) => {
    try {
      const res = await API.get(`/messages/${targetAdminId}`);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const formatted = (res.data || []).map((msg) => ({
        id: msg.id,
        text: msg.text,
        sender: Number(msg.user_id) === Number(storedUser.id) ? "customer" : "admin",
        message_type: msg.message_type || "normal",
        user_id: Number(msg.user_id),
        receiver_id: Number(msg.receiver_id),
        is_read: msg.is_read ?? false,
        payment_status: msg.payment_status || null,
        transaction_id: msg.transaction_id || null,
        created_at: msg.created_at,
        time: new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      }));
      setMessages(formatted);

      // Track last answer for session reset detection
      const lastAnswer = [...formatted].reverse().find(m => m.message_type === 'answer' && m.sender === 'admin');
      if (lastAnswer) setLastAnswerId(lastAnswer.id);

      await loadSessionStatus();
      await API.post('/messages/mark-read', { sender_id: targetAdminId });
    } catch (err) { console.error("Error loading messages:", err); }
  };

  // ── Load session status from backend ──
  const loadSessionStatus = async () => {
    try {
      const res = await API.get(`/messages/free-status?admin_id=${adminId}`);
      setSessionRemaining(res.data.session_remaining ?? res.data.global_remaining ?? 3);
      setSessionType(res.data.session_type ?? 'welcome');
      if (res.data.last_answer_id) setLastAnswerId(res.data.last_answer_id);
    } catch {}
  };

  // ── Real-time incoming messages ──
  useEffect(() => {
    if (!user) return;
    const channelName = `chat.${user.id}`;
    const channel = echo.private(channelName);

    const handleIncomingMessage = (data) => {
      const incomingUserId     = Number(data.user_id);
      const incomingReceiverId = Number(data.receiver_id);
      const myId               = Number(user.id);

      // Message from admin to me
      if (incomingReceiverId === myId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          playSound();
          if (document.hidden) setUnreadCount(prev.length + 1);

          const newMsg = {
            id: data.id,
            text: data.text || data.message,
            sender: "admin",
            message_type: data.message_type || "normal",
            payment_status: data.payment_status || null,
            user_id: incomingUserId,
            receiver_id: incomingReceiverId,
            created_at: data.created_at,
            time: new Date(data.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          };

          // ── SESSION RESET: admin sent ⭐ Answer ──
          if (data.message_type === 'answer') {
            setLastAnswerId(data.id);
            // Reset session counter to 3 immediately
            setSessionRemaining(3);
            setSessionType('active');
          }

          return [...prev, newMsg];
        });
        if (!document.hidden) clearNotification();
        return;
      }

      // My own sent message — replace temp
      if (incomingUserId === myId) {
        setMessages((prev) => {
          const hasTempWithSameText = prev.some((m) => String(m.id).startsWith("tmp-") && m.text === data.text);
          if (!hasTempWithSameText) return prev;
          return prev.map((m) =>
            String(m.id).startsWith("tmp-") && m.text === data.text
              ? {
                  id: data.id, text: data.text, sender: "customer",
                  message_type: data.message_type || "normal",
                  user_id: incomingUserId, receiver_id: incomingReceiverId,
                  created_at: data.created_at,
                  time: new Date(data.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                }
              : m
          );
        });
        return;
      }
    };

    channel.listen(".MessageSent", handleIncomingMessage);
    channel.listen(".UserTyping", () => {
      setAdminTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 2000);
    });

    return () => { channel.stopListening(".MessageSent", handleIncomingMessage); echo.leave(channelName); };
  }, [user]);

  // ── WebSocket health check ──
  useEffect(() => {
    if (!user?.id) return;
    const healthCheck = setInterval(() => {
      const state = window.Echo?.connector?.pusher?.connection?.state;
      if (state !== 'connected' && state !== 'connecting') window.Echo?.connector?.pusher?.connect();
    }, 15000);
    return () => clearInterval(healthCheck);
  }, [user]);

  const handleLogout = async () => {
    try { await API.post('/logout'); } catch {}
    finally { localStorage.clear(); window.location.href = "/login"; }
  };

  // ── Send message (validates limits) ──
  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    if (messageType === 'normal') {
      if (sessionRemaining <= 0) {
        if (sessionType === 'welcome') {
          alert("You have used all 3 free welcome messages. Please ask a paid question to continue.");
        } else {
          alert("You have used all 3 free messages for this session. Please ask a new paid question.");
        }
        setMessageType('question');
        return;
      }
    }

    if (messageType === "question") {
      const words = message.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length > 150) { alert("Your question exceeds the 150 word limit."); return; }
    }

    if (window.innerWidth < 1024) setShowSidebar(false);
    const text = message.trim();
    try {
      if (messageType === "question") { setPendingMessage(text); setShowPaymentModal(true); return; }
      await sendMessageWithPayment(text, null);
    } catch { alert("Failed to send message."); }
  };

  // ── Actually send message to API ──
  const sendMessageWithPayment = async (text, transactionId = null) => {
    const tempId             = `tmp-${Date.now()}`;
    const currentMessageType = messageType;

    setMessages((prev) => [...prev, {
      id: tempId, text, sender: "customer",
      message_type: currentMessageType,
      user_id: user.id, receiver_id: adminId,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    }]);
    playOutgoingSound();
    setMessage(""); setMessageType("normal"); setWordCount(0); setWordLimitError("");
    setTimeout(() => { const ta = document.querySelector('textarea'); if (ta) ta.style.height = 'auto'; }, 0);

    try {
      const payload = { text, receiver_id: adminId, message_type: currentMessageType };
      if (transactionId) payload.transaction_id = transactionId;

      const res  = await API.post("/messages", payload);
      const real = res.data;

      setMessages((prev) => prev.map((m) => m.id === tempId ? {
        id: real.id, text: real.text, sender: "customer",
        message_type: real.message_type || currentMessageType,
        payment_status: real.payment_status || null,
        user_id: Number(real.user_id), receiver_id: Number(real.receiver_id),
        created_at: real.created_at,
        time: new Date(real.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      } : m));

      // ── SESSION RESET: customer sent new question ──
      if (real.message_type === 'question') {
        setSessionRemaining(3);
        setSessionType('active');
      } else if (real.message_type === 'normal') {
        // Decrement immediately, then sync with backend
        setSessionRemaining(prev => Math.max(0, prev - 1));
      }

      // Sync with backend to stay accurate
      await loadSessionStatus();

    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(text); setMessageType(currentMessageType);
      if (err.response?.status === 402 || err.response?.data?.requires_payment) {
        setPendingMessage(text); setShowPaymentModal(true);
      } else alert("Failed to send message");
    }
  };

  const handlePaymentSubmit = async (transactionId) => {
    try { await sendMessageWithPayment(pendingMessage, transactionId); setShowPaymentModal(false); setPendingMessage(""); }
    catch (err) { throw err; }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); setTimeout(() => e.target.style.height = 'auto', 0); }
  };

  if (!user) return <LoadingScreen message="Connecting to Hamro Astro..." />;

  // Label shown on the normal button
  const normalButtonLabel = sessionRemaining > 0
    ? ` (${sessionRemaining} free)`
    : ' (limit reached)';

  return (
    <div className={`min-h-screen w-full flex relative ${bg}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
        .cinzel { font-family: 'Cinzel', serif; }
        .msg-sent     { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
        .msg-recv     { background: ${isDark ? '#1e2130' : '#f1f5f9'}; }
        .msg-answer   { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
        .msg-question { background: linear-gradient(135deg, #1e3a5f, #1e40af); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f4358; border-radius: 4px; }
        @keyframes typingBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
      `}</style>

      {/* Mobile sidebar toggle */}
      <button onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
        {showSidebar ? <FaTimes size={16} /> : <span style={{ fontSize: 18 }}>☰</span>}
      </button>

      {showSidebar && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setShowSidebar(false)} />}

      {/* ── SIDEBAR ── */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 sm:w-80 ${sidebarBg} border-r ${borderColor} flex flex-col overflow-hidden transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div className={`${headerBg} px-5 py-4 border-b ${borderColor} flex items-center justify-between flex-shrink-0`}>
          <div>
            <h2 className={`text-lg font-bold cinzel ${textPrimary}`}>✦ Hamro Astro</h2>
            <p className={`text-xs ${textSecondary}`}>Cosmic Guidance</p>
          </div>
          <button onClick={() => setShowSidebar(false)} className={`lg:hidden ${textSecondary}`}><FaTimes size={18} /></button>
        </div>

        {/* User info */}
        <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className={`font-semibold ${textPrimary} truncate`}>{user.name}</p>
              <p className={`text-xs ${textSecondary} truncate`}>{user.email}</p>
            </div>
          </div>

          {user.rashi && (
            <div className="rounded-xl px-3 py-2 mb-3 text-center" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p className={`text-xs ${textSecondary} mb-0.5`}>Your Rashi</p>
              <p className="text-amber-400 font-semibold text-sm cinzel">{user.rashi}</p>
            </div>
          )}
        </div>

        {/* User details */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {[
            { label: "Gender",          value: user.gender,     icon: "⚧" },
            { label: "Birth Date",       value: user.dob_nep ? new Date(user.dob_nep).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" }) + " (AD)" : null, icon: "📅" },
            { label: "Birth Time",       value: user.birth_time ? (() => { const [h, m] = user.birth_time.split(":"); const hr = parseInt(h); return `${String(hr % 12 || 12).padStart(2, "0")}:${m} ${hr >= 12 ? "PM" : "AM"}`; })() : null, icon: "⏰" },
            { label: "Birth Place",      value: [user.perm_street, user.perm_city, user.perm_country].filter(Boolean).join(", "), icon: "🏠" },
            { label: "Current Address",  value: [user.temp_street, user.temp_city, user.temp_country].filter(Boolean).join(", "), icon: "📍" },
          ].filter(item => item.value).map((item, i) => (
            <div key={i} className={`rounded-xl px-3 py-2.5 ${cardBg}`}>
              <p className={`text-xs ${textSecondary} mb-0.5`}>{item.icon} {item.label}</p>
              <p className={`text-sm ${textPrimary} font-medium break-words`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 space-y-2 flex-shrink-0" style={{ borderTop: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}` }}>
          <button onClick={() => navigate("/userprofile")}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all text-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}>
            ✏️ Edit My Profile
          </button>
          <div className="flex gap-2">
            <button onClick={toggleTheme}
              className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${textSecondary} border ${borderColor} ${isDark ? "hover:bg-[#1e2130]" : "hover:bg-gray-100"}`}>
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl text-sm text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 flex flex-col w-full lg:w-auto h-screen overflow-hidden">

        {/* Header */}
        <div className={`${headerBg} border-b ${borderColor} flex-shrink-0`}>
          <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 lg:hidden flex-shrink-0" />
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>✦</div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${adminOnline ? "bg-emerald-400" : "bg-gray-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-base font-bold cinzel ${textPrimary} truncate`}>Hamro Astro</h2>
              <p className={`text-xs ${adminOnline ? "text-emerald-400" : textSecondary}`}>
                {adminOnline ? "● Online — Ready to guide you" : "● Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-1"
          style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "cover" }}>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ background: "rgba(99,102,241,0.1)", border: "2px solid rgba(99,102,241,0.25)" }}>🔮</div>
              <div className="text-center">
                <p className={`text-base font-medium cinzel ${textPrimary} mb-1`}>Begin Your Journey</p>
                <p className={`text-sm ${textSecondary}`}>Ask your first question to Hamro Astro</p>
              </div>
            </div>
          ) : messages.map((m, index) => {
            const isMyMessage = m.sender === "customer";
            const currentDate = m.created_at ? new Date(m.created_at).toDateString() : null;
            const prevDate    = index > 0 && messages[index - 1].created_at ? new Date(messages[index - 1].created_at).toDateString() : null;
            const showDateSep = index === 0 || currentDate !== prevDate;

            return (
              <React.Fragment key={m.id}>
                {showDateSep && (
                  <div className="flex justify-center my-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${isDark ? "bg-[#1a1d27] text-gray-400" : "bg-white text-gray-500"} shadow-sm`}>
                      {getDateLabel(m.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-1`}>
                  {!isMyMessage && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-1"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>✦</div>
                  )}
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 shadow-sm cursor-pointer ${
                      isMyMessage
                        ? m.message_type === "question" ? "msg-question" : "msg-sent"
                        : m.message_type === "answer"   ? "msg-answer"   : "msg-recv"
                    }`}
                    style={{ borderRadius: isMyMessage ? "18px 18px 4px 18px" : "18px 18px 18px 4px" }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(m.text).then(() => {
                        const t = document.createElement("div");
                        t.innerText = "✓ Copied";
                        t.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#6366f1;color:white;padding:6px 16px;border-radius:20px;font-size:12px;z-index:9999;";
                        document.body.appendChild(t);
                        setTimeout(() => t.remove(), 1500);
                      }).catch(() => {});
                    }}
                  >
                    {/* Customer's paid question badge */}
                    {isMyMessage && m.message_type === "question" && (
                      <div className="mb-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-yellow-300 font-medium">💰 Paid Question</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                            m.payment_status === 'paid'     ? 'bg-emerald-500 text-white' :
                            m.payment_status === 'rejected' ? 'bg-red-500 text-white'     :
                                                              'bg-orange-500 text-white'
                          }`}>
                            {m.payment_status === 'paid'     ? '✓ Verified'  :
                             m.payment_status === 'rejected' ? '❌ Rejected' : '⏳ Awaiting'}
                          </span>
                        </div>
                        {m.transaction_id && (
                          <p className="text-xs text-white/40 mt-0.5 font-mono">TXN: {m.transaction_id}</p>
                        )}
                        {m.payment_status === 'rejected' && (
                          <p className="text-xs text-red-300 mt-1">⚠️ Payment rejected. Please contact admin.</p>
                        )}
                      </div>
                    )}

                    {/* Admin's answer badge */}
                    {!isMyMessage && m.message_type === "answer" && (
                      <p className="text-xs text-purple-200 mb-1 font-medium">⭐ Original Answer</p>
                    )}

                    <p className={`text-sm leading-relaxed break-words ${isMyMessage ? "text-white" : isDark ? "text-gray-100" : "text-gray-800"}`}>
                      {m.text}
                    </p>
                    <p className={`text-xs mt-1 text-right ${isMyMessage ? "text-white/60" : textSecondary}`}>{m.time}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {adminTyping && (
            <div className="flex justify-start items-end gap-2 mb-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>✦</div>
              <div className={`${isDark ? "bg-[#1e2130]" : "bg-white"} rounded-2xl px-4 py-3 flex items-center gap-1.5 shadow-sm`}
                style={{ borderRadius: "18px 18px 18px 4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                    style={{ animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
                <span className={`text-xs ${textSecondary} ml-1`}>Astro is typing</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div className={`${inputBg} border-t ${borderColor} flex-shrink-0`}>
          <div className="flex gap-2 px-3 sm:px-4 pt-2">

            {/* Normal Chat button */}
            <button
              onClick={() => { setMessageType("normal"); setWordCount(0); setWordLimitError(""); }}
              disabled={sessionRemaining <= 0}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all
                ${messageType === "normal" ? "text-white" : `${textSecondary} ${isDark ? "bg-[#1e2130]" : "bg-gray-100"}`}
                disabled:opacity-40 disabled:cursor-not-allowed`}
              style={messageType === "normal" ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}>
              <FaComments size={13} />
              <span className="hidden sm:inline">
                💬 Normal Chat{normalButtonLabel}
              </span>
              <span className="sm:hidden">
                💬 {sessionRemaining}
              </span>
            </button>

            {/* Ask Question button */}
            <button
              onClick={() => {
                setMessageType("question");
                if (message.trim()) {
                  const w = message.trim().split(/\s+/).filter(x => x.length > 0);
                  setWordCount(w.length);
                  if (w.length > 150) setWordLimitError("Exceeds 150 words!");
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all ${messageType === "question" ? "text-white" : `${textSecondary} ${isDark ? "bg-[#1e2130]" : "bg-gray-100"}`}`}
              style={messageType === "question" ? { background: "linear-gradient(135deg, #1e3a5f, #1e40af)" } : {}}>
              <FaQuestionCircle size={13} />
              <span className="hidden sm:inline">Ask Question (Rs. 20)</span>
              <span className="sm:hidden">Question</span>
            </button>
          </div>

          {messageType === "question" && (
            <div className="px-3 sm:px-4 pt-1.5">
              <p className={`text-xs ${wordCount > 150 ? 'text-red-400' : textSecondary}`}>
                {wordCount}/150 words {wordLimitError && <span className="text-red-400 ml-1">⚠️ {wordLimitError}</span>}
              </p>
            </div>
          )}

          <div className="px-3 sm:px-4 py-3 flex items-end gap-2">
            <textarea
              rows="1"
              value={message}
              onChange={(e) => {
                const text = e.target.value;
                setMessage(text);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                API.post('/typing', { receiver_id: adminId }).catch(() => {});
                if (messageType === "question") {
                  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
                  const count = text.trim() === "" ? 0 : words.length;
                  setWordCount(count);
                  setWordLimitError(count > 150 ? "Exceeds 150 word limit!" : "");
                }
              }}
              onKeyDown={handleKey}
              placeholder={messageType === "question" ? "Ask your question to the stars..." : "Type your message..."}
              autoComplete="off" autoCorrect="off" autoCapitalize="sentences"
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-hidden max-h-32 border ${borderColor}`}
              style={{ background: isDark ? "#0d0f14" : "#f8fafc", minHeight: "44px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || (messageType === "question" && wordCount > 150)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <IoSend size={16} />
            </button>
          </div>
        </div>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setMessage(pendingMessage); }}
          onPaymentSubmit={handlePaymentSubmit}
          amount={20} />
      </div>
    </div>
  );
}