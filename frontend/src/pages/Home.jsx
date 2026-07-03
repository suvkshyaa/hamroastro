import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated starfield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.alpha += s.speed;
        if (s.alpha > 1 || s.alpha < 0) s.speed *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 190, 255, ${s.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  const zodiacSigns = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #06040f 0%, #0d0721 40%, #130a2e 70%, #0a0620 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
        .cinzel { font-family: 'Cinzel', serif; }
        .inter { font-family: 'Inter', sans-serif; }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(139,92,246,0.3)} 50%{box-shadow:0 0 40px rgba(139,92,246,0.7),0 0 80px rgba(99,102,241,0.3)} }
        .float { animation: floatUp 4s ease-in-out infinite; }
        .rotate-slow { animation: rotateSlow 30s linear infinite; }
        .shimmer { animation: shimmer 3s ease-in-out infinite; }
        .fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
        .glow-btn { animation: glowPulse 2.5s ease-in-out infinite; }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(139,92,246,0.2); }
        .zodiac-scroll { animation: scrollLeft 25s linear infinite; }
        @keyframes scrollLeft { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>

      {/* Starfield canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Glowing orbs background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* NAV */}
      <nav className="relative z-10 border-b" style={{ borderColor: "rgba(139,92,246,0.2)", background: "rgba(6,4,15,0.6)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Hamro Astro" className="w-9 h-9 rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="cinzel font-semibold text-white text-lg tracking-wider">HAMRO ASTRO</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-purple-200 hover:text-white transition-colors inter">
              Login
            </button>
            <button onClick={() => navigate('/register')}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all inter"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", boxShadow: "0 4px 15px rgba(124,58,237,0.35)" }}>
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-10 text-center">

        {/* Floating orb */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="float relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-5xl sm:text-6xl"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.1) 60%, transparent 100%)", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 40px rgba(139,92,246,0.25), inset 0 0 30px rgba(139,92,246,0.1)" }}>
              🔮
            </div>
            {/* Orbit ring */}
            <div className="rotate-slow absolute inset-0 m-auto w-36 h-36 sm:w-40 sm:h-40 rounded-full -top-6 -left-6 sm:-top-6 sm:-left-6"
              style={{ border: "1px dashed rgba(139,92,246,0.3)" }} />
          </div>
        </div>

        {/* Headline */}
        <div className="fade-in-up" style={{ animationDelay: "0s", opacity: 0 }}>
          <p className="text-purple-400 text-sm sm:text-base inter tracking-widest uppercase mb-3 shimmer">✦ Your Cosmic Journey Awaits ✦</p>
          <h1 className="cinzel font-bold text-white mb-4 leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)" }}>
            Discover Your{" "}
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Cosmic Path
            </span>
          </h1>
          <p className="text-purple-200/70 inter text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Connect with experienced Vedic astrologers in real-time. Get personalized insights about your life, destiny, and the stars.
          </p>
        </div>

       {/* CTA Buttons */}
        <div className="fade-in-up flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <button onClick={() => navigate('/login')}
            className="glow-btn w-full sm:w-auto px-10 py-4 rounded-2xl text-white font-semibold text-base inter transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", boxShadow: "0 8px 30px rgba(124,58,237,0.4)" }}>
            💬 Start Chatting
          </button>
          <button onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl text-purple-300 font-medium text-base inter transition-all border"
            style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)" }}>
            ✨ Create Account
          </button>
        </div>

        {/* Stats */}
        <div className="fade-in-up flex flex-wrap justify-center gap-6 sm:gap-12 mt-14 sm:mt-16" style={{ animationDelay: "0.2s", opacity: 0 }}>
          {[
            { value: "500+", label: "Happy Seekers" },
            { value: "24/7", label: "Always Available" },
            { value: "100%", label: "Confidential" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="cinzel text-2xl sm:text-3xl font-bold" style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</p>
              <p className="text-purple-300/60 text-xs sm:text-sm inter mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Zodiac Scrolling Band */}
      <div className="relative z-10 overflow-hidden py-4 my-6" style={{ borderTop: "1px solid rgba(139,92,246,0.15)", borderBottom: "1px solid rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.04)" }}>
        <div className="zodiac-scroll flex gap-8 whitespace-nowrap">
          {[...zodiacSigns, ...zodiacSigns].map((sign, i) => (
            <span key={i} className="text-2xl sm:text-3xl opacity-40 hover:opacity-100 transition-opacity cursor-default" style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.5))" }}>{sign}</span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-center cinzel text-purple-400 text-sm tracking-widest uppercase mb-10 shimmer">✦ Why Choose Us ✦</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[
            { icon: "💬", title: "Real-Time Chat", desc: "Connect instantly with experienced Vedic astrologers who understand your cosmic blueprint.", color: "#818cf8" },
            { icon: "🌟", title: "Expert Guidance", desc: "Get personalized insights on love, career, health, and your life's true purpose.", color: "#a78bfa" },
            { icon: "🔒", title: "Private & Secure", desc: "Your conversations are completely confidential. What happens here, stays here.", color: "#c084fc" },
            { icon: "🪐", title: "Vedic Astrology", desc: "Rooted in ancient Vedic traditions with modern interpretation for today's challenges.", color: "#818cf8" },
            { icon: "💫", title: "Ask Questions", desc: "Submit your specific questions and receive detailed cosmic answers from our astrologers.", color: "#a78bfa" },
            { icon: "⚡", title: "Instant Answers", desc: "No waiting for days. Get real-time responses as your astrologer is online and ready.", color: "#c084fc" },
          ].map((f, i) => (
            <div key={i} className="card-hover rounded-2xl p-5 sm:p-6 border"
              style={{ background: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.15)", backdropFilter: "blur(10px)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `rgba(139,92,246,0.12)`, border: `1px solid rgba(139,92,246,0.2)` }}>
                {f.icon}
              </div>
              <h3 className="cinzel font-semibold text-white mb-2 text-base">{f.title}</h3>
              <p className="inter text-purple-200/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-center cinzel text-purple-400 text-sm tracking-widest uppercase mb-10 shimmer">✦ How It Works ✦</p>
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 items-center sm:items-start">
          {[
            { step: "01", icon: "📝", title: "Register", desc: "Create your account with your birth details for personalized readings." },
            { step: "02", icon: "💬", title: "Chat", desc: "Start chatting with our astrologer in real-time about your questions." },
            { step: "03", icon: "🌟", title: "Get Answers", desc: "Receive cosmic guidance tailored specifically to your birth chart." },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex-1 text-center px-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.2))", border: "1px solid rgba(139,92,246,0.3)" }}>
                  {s.icon}
                </div>
                <p className="cinzel text-purple-500 text-xs mb-1">{s.step}</p>
                <h4 className="cinzel font-semibold text-white mb-2">{s.title}</h4>
                <p className="inter text-purple-200/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden sm:flex items-center justify-center px-2 pt-6">
                  <div className="text-purple-600 text-2xl">→</div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.15))", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />
          <p className="cinzel text-purple-300 text-sm tracking-widest uppercase mb-3">Begin Your Journey</p>
          <h2 className="cinzel font-bold text-white text-2xl sm:text-3xl mb-4">The Stars Are Waiting For You</h2>
          <p className="inter text-purple-200/60 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Your cosmic path is written in the stars. Connect with Hamro Astro today and unlock the secrets of your destiny.
          </p>
          <button onClick={() => navigate('/register')}
            className="glow-btn px-10 py-4 rounded-2xl text-white font-semibold inter transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
            ✨ Get Started Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(6,4,15,0.4)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="cinzel text-purple-400 text-sm font-semibold">✦ HAMRO ASTRO</span>
          </div>
          <p className="inter text-purple-400/50 text-xs">© 2026 Hamro Astro. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="inter text-purple-400/60 hover:text-purple-300 text-xs transition-colors">Login</button>
            <button onClick={() => navigate('/register')} className="inter text-purple-400/60 hover:text-purple-300 text-xs transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;