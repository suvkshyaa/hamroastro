import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import echo from "../echo";
import LoadingScreen from "../components/LoadingScreen";
import { FaSearch, FaPaperPlane, FaEllipsisV, FaArrowLeft, FaCheckDouble, FaTimes, FaSignOutAlt, FaTachometerAlt, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useTabNotification } from "../hooks/useTabNotification";
import { useTheme } from "../hooks/useTheme";
import { useMessageSound } from "../hooks/useMessageSound";

export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const messagesEndRef = useRef(null);
  const [messageType, setMessageType] = useState("normal");
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRashi, setSelectedRashi] = useState("");
  const selectedUserRef = useRef(null);
  const sentMessageIds = useRef(new Set());
  const autoSelectedRef = useRef(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [customerTyping, setCustomerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const searchInputRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem("soundMuted") === "true");
  const { setUnreadCount, clearNotification } = useTabNotification();
  const { isDark, toggleTheme } = useTheme();
  const { playSound, playOutgoingSound, toggleMute } = useMessageSound();

  useOnlineStatus();

  const rashiList = [
    "Mesh (मेष)", "Vrishabh (वृषभ)", "Mithun (मिथुन)", "Karka (कर्क)",
    "Simha (सिंह)", "Kanya (कन्या)", "Tula (तुला)", "Vrishchik (वृश्चिक)",
    "Dhanu (धनु)", "Makar (मकर)", "Kumbh (कुम्भ)", "Meen (मीन)"
  ];

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

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    if (days === 0) return timeStr;
    if (days === 1) return `Yesterday`;
    if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    setCurrentUser(user);
  }, [navigate]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const state = window.Echo?.connector?.pusher?.connection?.state;
        if (state !== 'connected') window.Echo?.connector?.pusher?.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchChatUsers = async () => {
      try {
        const res = await API.get("/chat-users");
        const sorted = (res.data || []).sort((a, b) => {
          const da = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const db = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return db - da;
        });
        setChatUsers(sorted);
      } catch (err) {
        if (err.response?.status === 401) { localStorage.clear(); navigate("/login"); }
      }
    };
    fetchChatUsers();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (chatUsers.length === 0) return;
    const checkAllStatus = async () => {
      const onlineSet = new Set();
      await Promise.all(chatUsers.map(async (u) => {
        try { const res = await API.get(`/status/${u.id}`); if (res.data.is_online) onlineSet.add(u.id); } catch {}
      }));
      setOnlineUsers(onlineSet);
    };
    checkAllStatus();
    const interval = setInterval(checkAllStatus, 30000);
    return () => clearInterval(interval);
  }, [chatUsers]);

  useEffect(() => {
    if (!userId || chatUsers.length === 0) return;
    if (autoSelectedRef.current === userId) return;
    const userFromUrl = chatUsers.find((u) => String(u.id) === String(userId));
    if (userFromUrl) {
      autoSelectedRef.current = userId;
      selectedUserRef.current = userFromUrl;
      setSelectedUser(userFromUrl);
      setSelectedRashi(userFromUrl.rashi || "");
      fetchMessages(userFromUrl.id);
    }
  }, [userId, chatUsers]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const channelName = `chat.${currentUser.id}`;
    const channel = echo.private(channelName);

    const handleIncomingMessage = (data) => {
      const adminId = currentUser.id;
      const otherUserId = Number(data.user_id) === Number(adminId) ? Number(data.receiver_id) : Number(data.user_id);

      if (sentMessageIds.current.has(data.id)) {
        sentMessageIds.current.delete(data.id);
        return;
      }

      if (Number(selectedUserRef.current?.id) === Number(otherUserId)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          playSound();
          return [...prev, {
            id: data.id, text: data.text || data.message,
            user_id: Number(data.user_id), receiver_id: Number(data.receiver_id),
            message_type: data.message_type || "normal",
            payment_status: data.payment_status || null,
            is_paid: data.is_paid,
            payment_status: data.payment_status,
            transaction_id: data.transaction_id || null,
            created_at: data.created_at,
            sender_name: data.sender_name,
          }];
        });
      }

      if (Number(data.user_id) !== Number(adminId)) {
        setMessages((prev) => prev.map((m) =>
          Number(m.user_id) === Number(adminId) && Number(m.receiver_id) === Number(data.user_id)
            ? { ...m, is_read: true } : m
        ));
      }

      setChatUsers((prevUsers) => {
        const updated = prevUsers.map((u) => {
          if (Number(u.id) === Number(otherUserId)) {
            const newUnread = Number(selectedUserRef.current?.id) === Number(u.id) ? 0 : (u.unread_count || 0) + 1;
            if (document.hidden && newUnread > 0) setUnreadCount(newUnread);
            return { ...u, last_message: { id: data.id, text: data.text || data.message, user_id: data.user_id, receiver_id: data.receiver_id, created_at: data.created_at }, unread_count: newUnread };
          }
          return u;
        });
        return updated.sort((a, b) => {
          const da = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const db = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return db - da;
        });
      });
    };

    channel.listen(".MessageSent", handleIncomingMessage);
    channel.listen(".UserTyping", (data) => {
      if (Number(selectedUserRef.current?.id) === Number(data.user_id)) {
        setCustomerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setCustomerTyping(false), 2000);
      }
    });

    return () => { channel.stopListening(".MessageSent", handleIncomingMessage); echo.leave(channelName); };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const healthCheck = setInterval(() => {
      const state = window.Echo?.connector?.pusher?.connection?.state;
      if (state !== 'connected' && state !== 'connecting') window.Echo?.connector?.pusher?.connect();
    }, 15000);
    return () => clearInterval(healthCheck);
  }, [currentUser]);

  const fetchMessages = async (uid) => {
    setLoading(true);
    try {
      const response = await API.get(`/messages/${uid}`);
      setMessages((response.data || []).map((msg) => ({ ...msg, user_id: Number(msg.user_id), receiver_id: Number(msg.receiver_id) })));
      setChatUsers((prev) => prev.map((u) => u.id === uid ? { ...u, unread_count: 0 } : u));
    } catch (error) { console.error("Error fetching messages:", error); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await API.post('/logout'); } catch {}
    finally { localStorage.clear(); window.location.href = "/login"; }
  };

  const handleSelectUser = (user) => {
    selectedUserRef.current = user;
    setSelectedUser(user);
    setSelectedRashi(user.rashi || "");
    fetchMessages(user.id);
    navigate(`/messages/${user.id}`);
    clearNotification();
    API.post('/messages/mark-read', { sender_id: user.id })
      .then(() => setChatUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, unread_count: 0 } : u)))
      .catch(() => {});
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;
    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const currentMessageType = messageType;
    setMessages((prev) => [...prev, { id: tempId, text: messageText, user_id: currentUser.id, receiver_id: selectedUser.id, created_at: new Date().toISOString(), message_type: currentMessageType }]);
    playOutgoingSound();
    setNewMessage("");
    setMessageType("normal");
    try {
      const response = await API.post("/messages", { text: messageText, receiver_id: selectedUser.id, message_type: currentMessageType });
      const sentMessage = response.data;
      setMessages((prev) => prev.map((msg) => {
        if (msg.id === tempId) {
          sentMessageIds.current.add(sentMessage.id);
          return { ...sentMessage, user_id: Number(sentMessage.user_id), receiver_id: Number(sentMessage.receiver_id) };
        }
        return msg;
      }));
      setChatUsers((prevUsers) => {
        const updated = prevUsers.map((u) => u.id === selectedUser.id ? { ...u, last_message: sentMessage } : u);
        return updated.sort((a, b) => {
          const da = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const db = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return db - da;
        });
      });
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); setCurrentSearchIndex(0); return; }
    const results = messages.reduce((acc, msg, index) => {
      if (msg.text?.toLowerCase().includes(query.toLowerCase())) acc.push(index);
      return acc;
    }, []);
    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) document.getElementById(`msg-${results[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const filteredUsers = chatUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  const bg = isDark ? "bg-[#0d0f14]" : "bg-gray-50";
  const sidebarBg = isDark ? "bg-[#13151c]" : "bg-white";
  const headerBg = isDark ? "bg-[#1a1d27]" : "bg-white";
  const chatBg = isDark ? "bg-[#0a0c14]" : "bg-gray-100";
  const inputBg = isDark ? "bg-[#1a1d27]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-[#2a2d3a]" : "border-gray-200";
  const hoverBg = isDark ? "hover:bg-[#1e2130]" : "hover:bg-gray-50";
  const activeBg = isDark ? "bg-[#1e2130]" : "bg-indigo-50";

  return (
    <div className={`flex h-screen ${bg} overflow-hidden`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
        .cinzel { font-family: 'Cinzel', serif; }
        .msg-sent { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
        .msg-recv { background: ${isDark ? '#1e2130' : '#f1f5f9'}; }
        .msg-answer { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
        .msg-question { background: linear-gradient(135deg, #1e3a5f, #1e40af); }
        .star-dot::before { content: '✦'; color: #f59e0b; font-size: 8px; margin-right: 4px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f4358; border-radius: 4px; }
      `}</style>

      {/* SIDEBAR */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] flex-col ${sidebarBg} border-r ${borderColor}`}>

        {/* Sidebar Header */}
        <div className={`${headerBg} px-4 py-3 flex items-center justify-between border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                onClick={() => navigate("/adminprofile")}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {currentUser?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${textPrimary} cinzel`}>Hamro Astro</p>
              <p className="text-xs text-emerald-400">● Online</p>
            </div>
          </div>

          {/* 3 dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              className={`p-2 rounded-lg ${hoverBg} ${textSecondary} transition-colors`}
            >
              <FaEllipsisV size={14} />
            </button>
            {showHeaderMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowHeaderMenu(false)} />
                <div className={`absolute right-0 top-10 z-20 w-52 rounded-2xl shadow-2xl border ${borderColor} overflow-hidden`}
                  style={{ background: isDark ? "#1a1d27" : "white" }}>
                  <div className={`px-3 py-2 border-b ${borderColor}`}>
                    <p className={`text-xs ${textSecondary} cinzel tracking-wider`}>SETTINGS</p>
                  </div>
                  <button onClick={() => { navigate("/dashboard"); setShowHeaderMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${textPrimary} ${hoverBg} transition-colors`}>
                    <FaTachometerAlt className="text-indigo-400" size={14} />
                    <span>Dashboard</span>
                  </button>
                  <button onClick={() => { toggleTheme(); setShowHeaderMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${textPrimary} ${hoverBg} transition-colors`}>
                    <span className="text-amber-400">{isDark ? "☀️" : "🌙"}</span>
                    <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                  <button onClick={() => { const nm = toggleMute(); setMuted(nm); setShowHeaderMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${textPrimary} ${hoverBg} transition-colors`}>
                    {muted ? <FaVolumeMute className="text-gray-400" size={14} /> : <FaVolumeUp className="text-emerald-400" size={14} />}
                    <span>{muted ? "Unmute Sounds" : "Mute Sounds"}</span>
                  </button>
                  <div className={`border-t ${borderColor}`} />
                  <button onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 ${hoverBg} transition-colors`}>
                    <FaSignOutAlt size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className={`px-3 py-2 ${sidebarBg} border-b ${borderColor}`}>
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary} text-xs`} />
            <input type="text" placeholder="Search customers..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-sm ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              style={{ background: isDark ? "#0d0f14" : "#f8fafc" }} />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <span className="text-3xl">🔭</span>
              <p className={`text-sm ${textSecondary}`}>No customers found</p>
            </div>
          ) : filteredUsers.map((user) => (
            <div key={user.id} onClick={() => handleSelectUser(user)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b ${borderColor} ${selectedUser?.id === user.id ? activeBg : hoverBg}`}>
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  {user.name[0].toUpperCase()}
                </div>
                {onlineUsers.has(user.id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className={`font-medium ${textPrimary} truncate text-sm`}>{user.name}</h4>
                  <span className={`text-xs ${textSecondary} flex-shrink-0 ml-2`}>{formatTime(user.last_message?.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs ${textSecondary} truncate flex-1`}>{user.last_message?.text || "No messages yet"}</p>
                  {user.unread_count > 0 && (
                    <span className="ml-2 bg-indigo-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {user.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col ${chatBg} min-w-0`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className={`${headerBg} border-b ${borderColor} flex-shrink-0`}>
              <div className={`px-4 py-3 flex items-center gap-3`}>
                <FaArrowLeft className={`${textSecondary} md:hidden cursor-pointer`}
                  onClick={() => { selectedUserRef.current = null; setSelectedUser(null); navigate("/messages"); }} />
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    {selectedUser.name[0].toUpperCase()}
                  </div>
                  {onlineUsers.has(selectedUser.id) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${textPrimary} text-sm truncate`}>{selectedUser.name}</h3>
                  <p className={`text-xs ${onlineUsers.has(selectedUser.id) ? "text-emerald-400" : textSecondary}`}>
                    {onlineUsers.has(selectedUser.id) ? "● Online" : selectedUser.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); setSearchResults([]); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                    className={`p-2 rounded-lg ${hoverBg} ${textSecondary} transition-colors`}>
                    <FaSearch size={13} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowDropdown(!showDropdown)}
                      className={`p-2 rounded-lg ${hoverBg} ${textSecondary} transition-colors`}>
                      <FaEllipsisV size={13} />
                    </button>
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                        <div className={`absolute right-0 top-9 z-20 w-44 rounded-xl shadow-xl border ${borderColor} overflow-hidden`}
                          style={{ background: isDark ? "#1a1d27" : "white" }}>
                          <button onClick={() => { setShowDropdown(false); const n = localStorage.getItem(`note_${selectedUser.id}`) || ""; setNoteText(n); setSavedNote(n); setShowNoteModal(true); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${textPrimary} ${hoverBg}`}>
                            📝 <span>Note</span>
                            {savedNote && <span className="ml-auto w-2 h-2 bg-amber-400 rounded-full" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer info bar */}
              <div className={`px-4 py-2 border-t ${borderColor} flex flex-wrap gap-4 text-xs`}>
                <div className="flex items-center gap-2">
                  <span className={textSecondary}>Rashi:</span>
                  <select value={selectedRashi}
                    onChange={(e) => {
                      const v = e.target.value; setSelectedRashi(v);
                      if (v && selectedUser) API.post(`/users/${selectedUser.id}/rashi`, { rashi: v })
                        .then(() => setChatUsers(p => p.map(u => u.id === selectedUser.id ? { ...u, rashi: v } : u))).catch(() => {});
                    }}
                    className={`rounded-lg px-2 py-1 text-xs ${textPrimary} focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${borderColor}`}
                    style={{ background: isDark ? "#0d0f14" : "#f8fafc" }}>
                    <option value="">Select Rashi</option>
                    {rashiList.map((r, i) => <option key={i} value={r} style={{ background: isDark ? "#1a1d27" : "white" }}>{r}</option>)}
                  </select>
                </div>
                {selectedUser.gender && <span className={textSecondary}>⚧ {selectedUser.gender}</span>}
                {selectedUser.dob_nep && <span className={textSecondary}>📅 {new Date(selectedUser.dob_nep).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</span>}
                {selectedUser.birth_time && <span className={textSecondary}>⏰ {(() => { const [h, m] = selectedUser.birth_time.split(":"); const hr = parseInt(h); return `${String(hr % 12 || 12).padStart(2, "0")}:${m} ${hr >= 12 ? "PM" : "AM"}`; })()}</span>}
                {(selectedUser.perm_street || selectedUser.perm_city || selectedUser.perm_country) && (<span className={textSecondary}>🏠 {[selectedUser.perm_street, selectedUser.perm_city, selectedUser.perm_country].filter(Boolean).join(", ")}</span>)}
                {(selectedUser.temp_street || selectedUser.temp_city || selectedUser.temp_country) && (<span className={textSecondary}>📍 {[selectedUser.temp_street, selectedUser.temp_city, selectedUser.temp_country].filter(Boolean).join(", ")}</span>
              )}
            </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className={`${headerBg} border-b ${borderColor} px-3 py-2 flex items-center gap-2`}>
                <FaSearch className={`${textSecondary} text-xs flex-shrink-0`} />
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search messages..."
                  className={`flex-1 bg-transparent text-sm ${textPrimary} placeholder-gray-500 focus:outline-none`} />
                {searchQuery && <span className={`text-xs ${textSecondary}`}>{searchResults.length === 0 ? "No results" : `${currentSearchIndex + 1}/${searchResults.length}`}</span>}
                <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className={textSecondary}><FaTimes size={12} /></button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1"
              style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundSize: "cover", backgroundOpacity: 0.3 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <p className={`text-xs ${textSecondary}`}>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ background: "rgba(99,102,241,0.1)", border: "2px solid rgba(99,102,241,0.2)" }}>✨</div>
                  <p className={`text-sm ${textSecondary}`}>No messages yet</p>
                </div>
              ) : messages.map((msg, index) => {
                const isMyMessage = Number(msg.user_id) === Number(currentUser?.id);
                const currentDate = msg.created_at ? new Date(msg.created_at).toDateString() : null;
                const prevDate = index > 0 && messages[index - 1].created_at ? new Date(messages[index - 1].created_at).toDateString() : null;
                const showDateSep = index === 0 || currentDate !== prevDate;
                const isSearchResult = searchResults.includes(index);
                const isCurrentResult = searchResults[currentSearchIndex] === index;

                return (
                  <React.Fragment key={`${msg.id}-${index}`}>
                    {showDateSep && (
                      <div className="flex justify-center my-4">
                        <span className={`text-xs px-3 py-1 rounded-full ${isDark ? "bg-[#1a1d27] text-gray-400" : "bg-white text-gray-500"} shadow-sm`}>
                          {getDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div id={`msg-${index}`} className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-1`}>
                      <div
                        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm cursor-pointer ${
                          isMyMessage
                            ? msg.message_type === "answer" ? "msg-answer" : "msg-sent"
                            : msg.message_type === "question" ? "msg-question" : "msg-recv"
                        } ${isCurrentResult ? "ring-2 ring-yellow-400" : isSearchResult ? "ring-1 ring-yellow-400/50" : ""}`}
                        style={{ borderRadius: isMyMessage ? "18px 18px 4px 18px" : "18px 18px 18px 4px" }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(msg.text).then(() => {
                            const t = document.createElement("div");
                            t.innerText = "✓ Copied";
                            t.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#6366f1;color:white;padding:6px 16px;border-radius:20px;font-size:12px;z-index:9999;";
                            document.body.appendChild(t);
                            setTimeout(() => t.remove(), 1500);
                          }).catch(() => {});
                        }}
                      >
                        {isMyMessage && msg.message_type === "answer" && <p className="text-xs text-purple-200 mb-1 font-medium">⭐ Original Answer</p>}
                        {!isMyMessage && msg.message_type === "question" && (
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-yellow-300 font-medium">💰 Paid Question</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${
                              msg.payment_status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            }`}>
                              {msg.payment_status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                            </span>
                          </div>
                        )}
                        <p className={`text-sm leading-relaxed break-words ${isMyMessage ? "text-white" : isDark ? "text-gray-100" : "text-gray-800"}`}>{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-xs opacity-60 ${isMyMessage ? "text-white" : textSecondary}`}>
                            {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                          {isMyMessage && <FaCheckDouble className={`text-xs ${msg.is_read ? "text-blue-300" : "opacity-50 text-white"}`} />}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {customerTyping && selectedUser && (
                <div className="flex justify-start mb-1">
                  <div className={`rounded-2xl px-4 py-2.5 flex items-center gap-2 ${isDark ? "bg-[#1e2130]" : "bg-white"} shadow-sm`}
                    style={{ borderRadius: "18px 18px 18px 4px" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                        style={{ animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                    ))}
                    <span className={`text-xs ${textSecondary} ml-1`}>{selectedUser.name} is typing</span>
                  </div>
                </div>
              )}

              <style>{`@keyframes typingBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }`}</style>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`${inputBg} border-t ${borderColor} flex-shrink-0`}>
              <div className={`flex gap-2 px-3 pt-2`}>
                <button onClick={() => setMessageType("normal")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${messageType === "normal" ? "bg-indigo-500 text-white" : `${isDark ? "bg-[#1e2130]" : "bg-gray-100"} ${textSecondary}`}`}>
                  💬 Normal
                </button>
                <button onClick={() => setMessageType("answer")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${messageType === "answer" ? "bg-purple-600 text-white" : `${isDark ? "bg-[#1e2130]" : "bg-gray-100"} ${textSecondary}`}`}>
                  ⭐ Answer
                </button>
              </div>
              <div className="px-3 py-3 flex items-end gap-2">
                <textarea rows="1" value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                    if (selectedUser) API.post('/typing', { receiver_id: selectedUser.id }).catch(() => {});
                  }}
                  onKeyPress={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); setTimeout(() => e.target.style.height = 'auto', 0); } }}
                  placeholder={messageType === "answer" ? "Type your answer..." : "Type a message..."}
                  className={`flex-1 rounded-2xl px-4 py-2.5 text-sm ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-hidden max-h-32 border ${borderColor}`}
                  style={{ background: isDark ? "#0d0f14" : "#f8fafc", minHeight: "44px" }} />
                <button onClick={handleSendMessage} disabled={!newMessage.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0 ${messageType === "answer" ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-500 hover:bg-indigo-600"}`}>
                  <FaPaperPlane size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔮</div>
              <h2 className={`text-2xl font-light cinzel ${textPrimary} mb-2`}>Hamro Astro Admin</h2>
              <p className={`text-sm ${textSecondary}`}>Select a customer to begin the cosmic conversation</p>
            </div>
            {chatUsers.length > 0 && (
              <div className="flex gap-4">
                <div className="text-center px-5 py-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <p className="text-indigo-400 text-2xl font-bold">{chatUsers.length}</p>
                  <p className={`text-xs ${textSecondary} mt-1`}>Customers</p>
                </div>
                <div className="text-center px-5 py-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <p className="text-indigo-400 text-2xl font-bold">{chatUsers.reduce((s, u) => s + (u.unread_count || 0), 0)}</p>
                  <p className={`text-xs ${textSecondary} mt-1`}>Unread</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl`} style={{ background: isDark ? "#1a1d27" : "white" }}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${borderColor}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>📝</div>
                <div>
                  <p className={`text-sm font-semibold ${textPrimary}`}>Note</p>
                  <p className={`text-xs ${textSecondary}`}>{selectedUser?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowNoteModal(false)} className={`${textSecondary} hover:${textPrimary} text-xl`}>×</button>
            </div>
            <div className="p-5">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your notes here..."
                rows={5}
                className={`w-full rounded-xl px-4 py-3 text-sm ${textPrimary} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none border ${borderColor}`}
                style={{ background: isDark ? "#0d0f14" : "#f8fafc" }} autoFocus />
            </div>
            <div className={`flex gap-3 px-5 pb-5`}>
              <button onClick={() => setShowNoteModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm ${textSecondary} border ${borderColor} transition-colors`}>Cancel</button>
              <button onClick={() => { localStorage.setItem(`note_${selectedUser.id}`, noteText); setSavedNote(noteText); setShowNoteModal(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}