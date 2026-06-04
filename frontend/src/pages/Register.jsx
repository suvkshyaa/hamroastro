import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const zodiacSigns = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", email: "", birthdate: "", birthtime: "", gender: "",
    temp_country: "", temp_city: "", temp_street: "",
    perm_country: "", perm_city: "", perm_street: "",
    password: "", confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(""); setError(""); setErrors({}); setLoading(true);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirm_password) {
      setError("Please fill in all required fields"); setLoading(false); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrors({ email: "Please enter a valid email address" }); setError("Invalid email"); setLoading(false); return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrors({ confirm_password: "Passwords do not match" }); setError("Passwords do not match"); setLoading(false); return;
    }
    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" }); setError("Password too short"); setLoading(false); return;
    }

    try {
      const payload = {
        name: formData.name.trim(), email: formData.email.trim(),
        password: formData.password, password_confirmation: formData.confirm_password,
        gender: formData.gender || "male", dob_nep: formData.birthdate || "2000-01-01",
        birth_time: formData.birthtime || "12:00:00",
        temp_country: formData.temp_country || "Nepal", temp_city: formData.temp_city || "Kathmandu", temp_street: formData.temp_street || "",
        perm_country: formData.perm_country || "Nepal", perm_city: formData.perm_city || "Kathmandu", perm_street: formData.perm_street || "",
        role: "customer"
      };
      const res = await API.post("/register", payload);
      if (res.data.success || res.data.token) {
        const { token, user } = res.data;
        if (token) { API.defaults.headers.common['Authorization'] = `Bearer ${token}`; localStorage.setItem("token", token); }
        if (user) { localStorage.setItem("user", JSON.stringify(user)); localStorage.setItem("role", user.role || "customer"); }
        setSuccess("Registration successful! Redirecting...");
        setTimeout(() => navigate("/chat/1", { replace: true }), 1500);
      } else { setError(res.data.message || "Registration failed"); setLoading(false); }
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors || {};
        setErrors(validationErrors);
        const firstError = Object.values(validationErrors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : "Please check the form for errors");
      } else if (err.response?.status === 409) {
        setError("This email is already registered.");
      } else if (err.message === "Network Error") {
        setError("Cannot connect to server.");
      } else {
        setError(err.response?.data?.message || "Registration failed.");
      }
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-amber-400/20 rounded-xl px-4 py-3 text-amber-50 placeholder-amber-200/30 focus:outline-none focus:border-amber-400/60 focus:bg-white/10 transition-all duration-300 text-sm";
  const labelClass = "block text-amber-300/80 text-xs font-medium mb-1.5 tracking-wider uppercase";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{
      background: "radial-gradient(ellipse at 20% 50%, #1a0533 0%, #0a0118 40%, #000510 70%, #0d0520 100%)"
    }}>

      {/* Animated stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: Math.random() * 2 + 0.5 + "px",
            height: Math.random() * 2 + 0.5 + "px",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            opacity: Math.random() * 0.7 + 0.1,
            animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + "s"
          }} />
        ))}
      </div>

      {/* Zodiac symbols floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {zodiacSigns.map((sign, i) => (
          <div key={i} className="absolute text-amber-400/10 select-none" style={{
            fontSize: Math.random() * 30 + 20 + "px",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            animation: `float ${Math.random() * 10 + 15}s ease-in-out infinite`,
            animationDelay: Math.random() * 10 + "s"
          }}>{sign}</div>
        ))}
      </div>

      {/* Glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)",
        filter: "blur(40px)"
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
        @keyframes twinkle { 0%,100%{opacity:0.1} 50%{opacity:0.9} }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(10deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .cinzel { font-family: 'Cinzel', serif; }
        .crimson { font-family: 'Crimson Pro', serif; }
        .gold-shimmer {
          background: linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b, #fbbf24);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .card-glow {
          box-shadow: 0 0 60px rgba(251,191,36,0.06), 0 0 120px rgba(139,92,246,0.04), inset 0 1px 0 rgba(251,191,36,0.1);
        }
        .step-btn { transition: all 0.3s ease; }
        .step-btn:hover { transform: translateY(-1px); }
      `}</style>

      <div className="w-full max-w-2xl relative" style={{ animation: "fadeUp 0.6s ease-out" }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✦</div>
          <h1 className="cinzel text-3xl font-bold gold-shimmer mb-2">Hamro Astro</h1>
          <p className="crimson text-amber-200/50 text-lg italic">Begin your celestial journey</p>
        </div>

        {/* Card */}
        <div className="card-glow rounded-3xl p-8 border border-amber-400/10" style={{
          background: "rgba(15, 5, 30, 0.85)", backdropFilter: "blur(20px)"
        }}>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs cinzel font-bold transition-all duration-300 ${
                  step === s ? "bg-amber-400 text-gray-900" :
                  step > s ? "bg-amber-400/30 text-amber-400 border border-amber-400/50" :
                  "bg-white/5 text-amber-400/30 border border-amber-400/10"
                }`}>{step > s ? "✓" : s}</div>
                {s < 3 && <div className={`h-px w-12 transition-all duration-500 ${step > s ? "bg-amber-400/50" : "bg-white/10"}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="text-center mb-6">
            <p className="cinzel text-amber-300/60 text-xs tracking-widest uppercase">
              {step === 1 ? "Personal Details" : step === 2 ? "Your Abode" : "Sacred Credentials"}
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm crimson text-center">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm crimson text-center">
              ✦ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Step 1 - Personal */}
            {step === 1 && (
              <div className="space-y-4" style={{ animation: "fadeUp 0.4s ease-out" }}>
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>}
                </div>

                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className={inputClass} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Birth Date</label>
                    <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label className={labelClass}>Birth Time</label>
                    <input type="time" name="birthtime" value={formData.birthtime} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }}>
                    <option value="" style={{ background: "#0a0118" }}>Select gender</option>
                    <option value="male" style={{ background: "#0a0118" }}>Male</option>
                    <option value="female" style={{ background: "#0a0118" }}>Female</option>
                    <option value="other" style={{ background: "#0a0118" }}>Other</option>
                  </select>
                </div>

                <button type="button" onClick={() => setStep(2)} className="step-btn w-full mt-2 py-3.5 rounded-xl cinzel text-sm font-semibold tracking-wider text-gray-900" style={{
                  background: "linear-gradient(135deg, #f59e0b, #fbbf24)"
                }}>
                  Continue to Address →
                </button>
              </div>
            )}

            {/* Step 2 - Address */}
            {step === 2 && (
              <div className="space-y-5" style={{ animation: "fadeUp 0.4s ease-out" }}>
                <div>
                  <h3 className="cinzel text-amber-400/70 text-xs tracking-widest uppercase mb-3">Current Address</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="Country" name="temp_country" value={formData.temp_country} onChange={handleChange} className={inputClass} />
                    <input type="text" placeholder="City" name="temp_city" value={formData.temp_city} onChange={handleChange} className={inputClass} />
                    <input type="text" placeholder="Street" name="temp_street" value={formData.temp_street} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                <div className="border-t border-amber-400/10 pt-5">
                  <h3 className="cinzel text-amber-400/70 text-xs tracking-widest uppercase mb-3">Permanent Address</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="Country" name="perm_country" value={formData.perm_country} onChange={handleChange} className={inputClass} />
                    <input type="text" placeholder="City" name="perm_city" value={formData.perm_city} onChange={handleChange} className={inputClass} />
                    <input type="text" placeholder="Street" name="perm_street" value={formData.perm_street} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="step-btn flex-1 py-3.5 rounded-xl cinzel text-sm font-semibold tracking-wider text-amber-400 border border-amber-400/30 hover:border-amber-400/60">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="step-btn flex-1 py-3.5 rounded-xl cinzel text-sm font-semibold tracking-wider text-gray-900" style={{
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)"
                  }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 - Password */}
            {step === 3 && (
              <div className="space-y-4" style={{ animation: "fadeUp 0.4s ease-out" }}>
                <div className="relative">
                  <label className={labelClass}>Password *</label>
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" className={inputClass + " pr-12"} />
                  <span onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-amber-400/50 hover:text-amber-400 cursor-pointer transition-colors">
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </span>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}
                </div>

                <div className="relative">
                  <label className={labelClass}>Confirm Password *</label>
                  <input type={showCPassword ? "text" : "password"} name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Repeat your password" className={inputClass + " pr-12"} />
                  <span onClick={() => setShowCPassword(!showCPassword)} className="absolute right-4 top-9 text-amber-400/50 hover:text-amber-400 cursor-pointer transition-colors">
                    {showCPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </span>
                  {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password}</p>}
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{
                          background: formData.password.length >= i * 2 + 4
                            ? i <= 1 ? "#ef4444" : i <= 2 ? "#f97316" : i <= 3 ? "#eab308" : "#22c55e"
                            : "rgba(255,255,255,0.1)"
                        }} />
                      ))}
                    </div>
                    <p className="text-xs text-amber-400/40 crimson">
                      {formData.password.length < 6 ? "Too weak" : formData.password.length < 8 ? "Weak" : formData.password.length < 12 ? "Good" : "Strong"}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(2)} className="step-btn flex-1 py-3.5 rounded-xl cinzel text-sm font-semibold tracking-wider text-amber-400 border border-amber-400/30 hover:border-amber-400/60">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading} className="step-btn flex-1 py-3.5 rounded-xl cinzel text-sm font-semibold tracking-wider text-gray-900 disabled:opacity-50" style={{
                    background: loading ? "rgba(251,191,36,0.4)" : "linear-gradient(135deg, #f59e0b, #fbbf24)"
                  }}>
                    {loading ? "✦ Registering..." : "✦ Begin Journey"}
                  </button>
                </div>
              </div>
            )}

          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="crimson text-amber-200/30 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-400/70 hover:text-amber-400 transition-colors underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>

          {/* Decorative bottom */}
          <div className="mt-6 flex items-center justify-center gap-2 opacity-30">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
            <span className="text-amber-400 text-xs">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

        </div>

        <p className="text-center text-amber-200/20 text-xs crimson mt-6">
          © 2026 Hamro Astro · Your cosmic companion
        </p>
      </div>
    </div>
  );
}