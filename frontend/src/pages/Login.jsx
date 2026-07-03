import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../api";
import { setAuthToken } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    if (error) setError("");
  };

  // ── Get admin ID dynamically instead of hardcoding 1 ──
  const getAdminIdAndRedirect = async () => {
    try {
      const res = await API.get("/admin-info");
      const adminId = res.data?.admin_id || 1; // fallback to 1 if endpoint fails
      navigate(`/chat/${adminId}`);
    } catch {
      navigate("/chat/1"); // fallback if request fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/login", {
        email: form.email.trim(),
        password: form.password.trim(),
      });

      if (!res.data.token || !res.data.user) {
        setError("Invalid login response");
        setLoading(false);
        return;
      }

      const { token, user } = res.data;
      setAuthToken(token);
      localStorage.setItem("user", JSON.stringify(user));
      const role = user.role?.toLowerCase() === "admin" ? "admin" : "customer";
      localStorage.setItem("role", role);

      if (role === "admin") {
        navigate("/messages");
      } else {
        await getAdminIdAndRedirect();
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setError("Please check your input.");
      } else if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#2a3942] border border-[#3d4a54] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] transition-all text-sm";
  const labelClass = "block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#00a884] flex items-center justify-center text-2xl mx-auto mb-4">
            🌟
          </div>
          <h1 className="text-white text-2xl font-semibold">Hamro Astro</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-[#202c33] rounded-2xl border border-[#2a3942] overflow-hidden">

          {/* Card Header */}
          <div className="px-6 py-4 border-b border-[#2a3942]">
            <h2 className="text-white font-semibold">Sign In</h2>
            <p className="text-gray-400 text-xs mt-0.5">Enter your credentials to access your account</p>
          </div>

          {/* Form */}
          <div className="px-6 py-6 space-y-5">

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                ⚠ {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={inputClass}
                required
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={inputClass + " pr-12"}
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </span>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading ? "rgba(0,168,132,0.4)" : "#00a884" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#2a3942] text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#00a884] hover:text-[#06cf9c] transition-colors font-medium">
                Create one
              </Link>
            </p>
          </div>

        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Hamro Astro
        </p>
      </div>
    </div>
  );
}