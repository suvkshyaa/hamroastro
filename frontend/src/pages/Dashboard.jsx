import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [usersRes, messagesRes] = await Promise.all([
        API.get("/chat-users"),
        API.get("/messages"),
      ]);

      const users = usersRes.data || [];
      const messages = messagesRes.data || [];

      const totalUnread = users.reduce((sum, u) => sum + (u.unread_count || 0), 0);
      const paidMessages = messages.filter(m => m.payment_status === "paid").length;
      const todayMessages = messages.filter(m => {
        const today = new Date().toDateString();
        return new Date(m.created_at).toDateString() === today;
      }).length;

      setStats({
        totalCustomers: users.length,
        totalMessages: messages.length,
        unreadMessages: totalUnread,
        paidQuestions: paidMessages,
        todayMessages,
        activeCustomers: users.filter(u => u.last_message).length,
      });

      // Get recent messages
      setRecentMessages(messages.slice(-5).reverse());
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-[#202c33] rounded-2xl p-5 border border-[#2a3942]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value ?? "—"}</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#2a3942] border-t-[#00a884] animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111b21] text-white">

      {/* Header */}
      <div className="bg-[#202c33] border-b border-[#2a3942] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="font-semibold text-white">Dashboard</h1>
            <p className="text-xs text-gray-400">Hamro Astro Overview</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          className="text-xs text-[#00a884] border border-[#00a884]/20 px-3 py-1.5 rounded-lg hover:bg-[#00a884]/10 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon="👥" label="Total Customers" value={stats?.totalCustomers} color="#00a884" />
          <StatCard icon="💬" label="Total Messages" value={stats?.totalMessages} color="#3b82f6" />
          <StatCard icon="🔴" label="Unread" value={stats?.unreadMessages} color="#ef4444" />
          <StatCard icon="💰" label="Paid Questions" value={stats?.paidQuestions} color="#f59e0b" />
          <StatCard icon="📅" label="Today's Messages" value={stats?.todayMessages} color="#8b5cf6" />
          <StatCard icon="✅" label="Active Customers" value={stats?.activeCustomers} color="#10b981" />
        </div>

        {/* Revenue estimate */}
        <div className="bg-[#202c33] rounded-2xl p-5 border border-[#2a3942]">
          <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Revenue Estimate</h2>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-[#00a884]">
              Rs. {(stats?.paidQuestions || 0) * 20}
            </p>
            <p className="text-gray-500 text-sm mb-1">from {stats?.paidQuestions} paid questions</p>
          </div>
          <div className="mt-3 h-2 bg-[#2a3942] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(((stats?.paidQuestions || 0) / (stats?.totalMessages || 1)) * 100, 100)}%`,
                background: "linear-gradient(90deg, #00a884, #06cf9c)"
              }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1">
            {stats?.totalMessages > 0
              ? `${Math.round(((stats?.paidQuestions || 0) / stats.totalMessages) * 100)}% of messages are paid`
              : "No messages yet"}
          </p>
        </div>

        {/* Recent Messages */}
        <div className="bg-[#202c33] rounded-2xl border border-[#2a3942] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a3942]">
            <h2 className="text-gray-400 text-xs uppercase tracking-widest">Recent Messages</h2>
          </div>
          <div className="divide-y divide-[#2a3942]">
            {recentMessages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No messages yet</p>
            ) : (
              recentMessages.map((msg, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center text-xs font-bold text-[#00a884] flex-shrink-0">
                    {msg.sender_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{msg.text}</p>
                    <p className="text-gray-500 text-xs">{msg.sender_name || "Unknown"}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-gray-500 text-xs">{formatTime(msg.created_at)}</p>
                    {msg.payment_status === "paid" && (
                      <span className="text-[10px] text-amber-400">💰 Paid</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="bg-[#202c33] rounded-2xl p-4 border border-[#2a3942] text-left hover:border-[#00a884]/30 transition-all"
          >
            <span className="text-2xl block mb-2">💬</span>
            <p className="text-white text-sm font-medium">View Chats</p>
            <p className="text-gray-500 text-xs">Respond to customers</p>
          </button>
          <button
            onClick={() => navigate("/adminprofile")}
            className="bg-[#202c33] rounded-2xl p-4 border border-[#2a3942] text-left hover:border-[#00a884]/30 transition-all"
          >
            <span className="text-2xl block mb-2">👤</span>
            <p className="text-white text-sm font-medium">My Profile</p>
            <p className="text-gray-500 text-xs">Update your details</p>
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs pb-4">
          © 2026 Hamro Astro
        </p>
      </div>
    </div>
  );
}