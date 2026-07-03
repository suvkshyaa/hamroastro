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

      const paidQuestions = messages.filter(
        m => m.message_type === "question" && m.payment_status === "paid"
      ).length;

      const pendingQuestions = messages.filter(
        m => m.message_type === "question" &&
        (m.payment_status === null || m.payment_status === undefined || m.payment_status === "pending")
      ).length;

      const today = new Date().toDateString();
      const todayMessages = messages.filter(
        m => new Date(m.created_at).toDateString() === today
      ).length;

      const todayPaid = messages.filter(
        m => m.message_type === "question" &&
        m.payment_status === "paid" &&
        new Date(m.created_at).toDateString() === today
      ).length;

      setStats({
        totalCustomers: users.length,
        totalMessages: messages.length,
        unreadMessages: totalUnread,
        paidQuestions,
        pendingQuestions,
        todayMessages,
        todayPaid,
        activeCustomers: users.filter(u => u.last_message).length,
      });

      setRecentMessages(messages.slice(-5).reverse());
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#21262d] border-t-[#3fb950] animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const revenue = (stats?.paidQuestions || 0) * 20;
  const todayRevenue = (stats?.todayPaid || 0) * 20;
  const unreadCount = stats?.unreadMessages || 0;
  const pendingCount = stats?.pendingQuestions || 0;
  const hasAttention = unreadCount > 0 || pendingCount > 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#21262d] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="text-gray-400 hover:text-white transition-colors text-lg"
          >
            ←
          </button>
          <div>
            <h1 className="font-semibold text-white">Dashboard</h1>
            <p className="text-xs text-gray-500">Hamro Astro Overview</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          className="text-xs text-[#3fb950] border border-[#3fb950]/20 px-3 py-1.5 rounded-lg hover:bg-[#3fb950]/10 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Headline: Revenue, the thing the business cares about most ── */}
        <div className="bg-gradient-to-br from-[#0d2818] to-[#161b22] rounded-2xl p-6 border border-[#238636]/30">
          <p className="text-[#3fb950] text-xs uppercase tracking-widest font-medium mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-5xl font-bold text-white">Rs. {revenue}</p>
            {todayRevenue > 0 && (
              <span className="text-sm text-[#3fb950] bg-[#3fb950]/10 px-2.5 py-1 rounded-full font-medium">
                +Rs. {todayRevenue} today
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {stats?.paidQuestions > 0
              ? `From ${stats.paidQuestions} paid question${stats.paidQuestions === 1 ? '' : 's'} at Rs. 20 each`
              : "No paid questions yet — revenue will appear here once customers pay"}
          </p>
        </div>

        {/* ── Needs attention: only shows when there's something to act on ── */}
        {hasAttention && (
          <div className="bg-[#2d1b06] border border-[#9e6a03]/40 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 text-sm font-medium">Needs your attention</p>
              <p className="text-amber-200/60 text-xs mt-0.5">
                {unreadCount > 0 && `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
                {unreadCount > 0 && pendingCount > 0 && " · "}
                {pendingCount > 0 && `${pendingCount} question${pendingCount === 1 ? '' : 's'} awaiting payment review`}
              </p>
            </div>
            <button
              onClick={() => navigate("/messages")}
              className="text-xs font-medium text-amber-200 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all flex-shrink-0"
            >
              Review →
            </button>
          </div>
        )}

        {/* ── Activity at a glance: grouped by what they're measuring ── */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">Activity Today</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💬</span>
                <span className="text-xs text-gray-500">Messages</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.todayMessages ?? 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">out of {stats?.totalMessages ?? 0} total</p>
            </div>
            <div className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💰</span>
                <span className="text-xs text-gray-500">Paid today</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.todayPaid ?? 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">{stats?.paidQuestions ?? 0} all-time</p>
            </div>
          </div>
        </div>

        {/* ── Customer base ── */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">Customer Base</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d] text-center">
              <p className="text-2xl font-bold text-white">{stats?.totalCustomers ?? 0}</p>
              <p className="text-gray-500 text-xs mt-1">Total</p>
            </div>
            <div className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d] text-center">
              <p className="text-2xl font-bold text-[#3fb950]">{stats?.activeCustomers ?? 0}</p>
              <p className="text-gray-500 text-xs mt-1">Active</p>
            </div>
            <div className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d] text-center">
              <p className={`text-2xl font-bold ${unreadCount > 0 ? "text-red-400" : "text-white"}`}>
                {unreadCount}
              </p>
              <p className="text-gray-500 text-xs mt-1">Unread</p>
            </div>
          </div>
          {stats?.totalCustomers > 0 && (
            <div className="mt-2 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#3fb950] transition-all duration-700"
                style={{ width: `${Math.min((stats.activeCustomers / stats.totalCustomers) * 100, 100)}%` }}
              />
            </div>
          )}
          {stats?.totalCustomers > 0 && (
            <p className="text-gray-600 text-xs mt-1.5">
              {Math.round((stats.activeCustomers / stats.totalCustomers) * 100)}% of customers have started a conversation
            </p>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-[#161b22] rounded-2xl border border-[#21262d] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#21262d]">
            <h2 className="text-gray-500 text-xs uppercase tracking-widest font-medium">Recent Messages</h2>
          </div>
          <div className="divide-y divide-[#21262d]">
            {recentMessages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No messages yet — they'll show up here once customers start chatting</p>
            ) : (
              recentMessages.map((msg, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-[#3fb950] flex-shrink-0">
                    {msg.sender_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{msg.text}</p>
                    <p className="text-gray-500 text-xs">{msg.sender_name || "Unknown"}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-gray-500 text-xs">{formatTime(msg.created_at)}</p>
                    {msg.message_type === "question" && msg.payment_status === "paid" && (
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
            className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d] text-left hover:border-[#3fb950]/40 transition-all"
          >
            <span className="text-2xl block mb-2">💬</span>
            <p className="text-white text-sm font-medium">View Chats</p>
            <p className="text-gray-500 text-xs">Respond to customers</p>
          </button>
          <button
            onClick={() => navigate("/adminprofile")}
            className="bg-[#161b22] rounded-2xl p-4 border border-[#21262d] text-left hover:border-[#3fb950]/40 transition-all"
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