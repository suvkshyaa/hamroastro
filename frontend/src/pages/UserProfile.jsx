import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import LoadingScreen from "../components/LoadingScreen";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", gender: "", dob_nep: "", birth_time: "",
    perm_country: "", perm_city: "", perm_street: "",
    temp_country: "", temp_city: "", temp_street: "",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) { navigate("/login"); return; }
    if (storedUser.role?.toLowerCase() === "admin") { navigate("/messages"); return; }

    setUser(storedUser);
    setFormData({
      name: storedUser.name || "",
      gender: storedUser.gender || "",
      dob_nep: storedUser.dob_nep || "",
      birth_time: storedUser.birth_time || "",
      perm_country: storedUser.perm_country || "",
      perm_city: storedUser.perm_city || "",
      perm_street: storedUser.perm_street || "",
      temp_country: storedUser.temp_country || "",
      temp_city: storedUser.temp_city || "",
      temp_street: storedUser.temp_street || "",
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
    if (success) setSuccess("");
  };




// Find handleSubmit and update:
const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");
    try {
      const res = await API.post("/profile/update", formData);
      
      // ✅ Use the data returned from server, not just formData
      const updatedUser = res.data.user || { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setSuccess("Profile updated successfully!");
      
      // ✅ Navigate back after 1.5 seconds so customer sees updated sidebar
      setTimeout(() => {
        navigate("/chat/1");
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };




  const inputClass = "w-full bg-[#2a3942] border border-[#3d4a54] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] transition-all text-sm";
  const labelClass = "block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider";

if (!user) return <LoadingScreen message="Loading your profile..." />;
  return (
    <div className="min-h-screen bg-[#111b21] text-white">

      {/* Header */}
      <div className="bg-[#202c33] border-b border-[#2a3942] px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/chat/1")}
          className="text-gray-400 hover:text-white transition-colors text-lg"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-lg text-white">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm sm:text-base">{user.name}</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-xs text-gray-500 bg-[#2a3942] px-3 py-1 rounded-full">Edit Profile</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Personal Information */}
          <div className="bg-[#202c33] rounded-2xl border border-[#2a3942] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2a3942]">
              <h2 className="text-gray-400 text-xs uppercase tracking-widest">Personal Information</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                  <option value="" style={{ background: "#1c2730" }}>Select gender</option>
                  <option value="male" style={{ background: "#1c2730" }}>Male</option>
                  <option value="female" style={{ background: "#1c2730" }}>Female</option>
                  <option value="other" style={{ background: "#1c2730" }}>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Birth Date</label>
                  <input
                    type="date"
                    name="dob_nep"
                    value={formData.dob_nep}
                    onChange={handleChange}
                    className={inputClass}
                    style={{ colorScheme: "dark" }}
                  />
                  {formData.dob_nep && (
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(formData.dob_nep).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "2-digit"
                      })} (AD)
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Birth Time</label>
                  <input
                    type="time"
                    name="birth_time"
                    value={formData.birth_time}
                    onChange={handleChange}
                    className={inputClass}
                    style={{ colorScheme: "dark" }}
                  />
                  {formData.birth_time && (
                    <p className="text-gray-500 text-xs mt-1">
                      {(() => {
                        const [h, m] = formData.birth_time.split(":");
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const hour12 = hour % 12 || 12;
                        return `${String(hour12).padStart(2, "0")}:${m} ${ampm}`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div className="bg-[#202c33] rounded-2xl border border-[#2a3942] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2a3942]">
              <h2 className="text-gray-400 text-xs uppercase tracking-widest">Birth Place (Permanent Address)</h2>
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" name="perm_country" value={formData.perm_country} onChange={handleChange} placeholder="Nepal" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="perm_city" value={formData.perm_city} onChange={handleChange} placeholder="Kathmandu" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Street</label>
                  <input type="text" name="perm_street" value={formData.perm_street} onChange={handleChange} placeholder="Thamel" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Current Address */}
          <div className="bg-[#202c33] rounded-2xl border border-[#2a3942] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2a3942]">
              <h2 className="text-gray-400 text-xs uppercase tracking-widest">Current Address</h2>
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" name="temp_country" value={formData.temp_country} onChange={handleChange} placeholder="Nepal" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="temp_city" value={formData.temp_city} onChange={handleChange} placeholder="Pokhara" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Street</label>
                  <input type="text" name="temp_street" value={formData.temp_street} onChange={handleChange} placeholder="Lakeside" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: saving ? "rgba(0,168,132,0.4)" : "#00a884" }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : "✅ Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/chat/1")}
            className="w-full py-3 rounded-xl text-sm text-gray-400 border border-[#2a3942] hover:border-gray-500 hover:text-gray-200 transition-all"
          >
            ← Back to Chat
          </button>

        </form>

        <p className="text-center text-gray-600 text-xs pb-6">
          © 2026 Hamro Astro
        </p>
      </div>
    </div>
  );
}