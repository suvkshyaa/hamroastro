import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import LoadingScreen from "../components/LoadingScreen";

export default function AdminProfile() {
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
    // ✅ Only admin can access this page
    if (!storedUser || storedUser.role !== "admin") {
      navigate("/login");
      return;
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");
    try {
      await API.post("/profile/update", formData);
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-[#2a3942] border border-[#3d4a54] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] transition-all text-sm";
  const labelClass = "block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider";

if (!user) return <LoadingScreen message="Loading admin profile..." />;
  return (
    <div className="min-h-screen bg-[#111b21] text-white">

      {/* Header */}
      <div className="bg-[#202c33] border-b border-[#2a3942] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/messages")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">
            {user.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <h1 className="font-semibold text-white">Admin Profile</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-300 text-sm">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Personal Info */}
          <div className="bg-[#202c33] rounded-2xl p-6 space-y-4 border border-[#2a3942]">
            <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Personal Information</h2>

            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Admin name" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Birth Date</label>
                <input type="date" name="dob_nep" value={formData.dob_nep} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className={labelClass}>Birth Time</label>
                <input type="time" name="birth_time" value={formData.birth_time} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div className="bg-[#202c33] rounded-2xl p-6 border border-[#2a3942]">
            <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Permanent Address</h2>
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

          {/* Current Address */}
          <div className="bg-[#202c33] rounded-2xl p-6 border border-[#2a3942]">
            <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Current Address</h2>
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

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: saving ? "rgba(0,168,132,0.4)" : "#00a884" }}
          >
            {saving ? "Saving..." : "✅ Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="w-full py-3 rounded-xl text-sm text-gray-400 border border-[#2a3942] hover:border-gray-500 hover:text-gray-200 transition-all"
          >
            ← Back to Messages
          </button>

        </form>
      </div>
    </div>
  );
}