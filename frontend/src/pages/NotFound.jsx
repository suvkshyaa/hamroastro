import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase();

  const goHome = () => {
    if (role === "admin") navigate("/messages");
    else if (role === "customer") navigate("/chat/1");
    else navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        
        {/* Icon */}
        <div className="text-8xl mb-6">🌌</div>
        
        {/* Error code */}
        <h1 className="text-6xl font-bold text-[#00a884] mb-4">404</h1>
        
        {/* Message */}
        <h2 className="text-white text-2xl font-semibold mb-3">
          Lost in the Stars
        </h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has moved to another constellation.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goHome}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#00a884" }}
          >
            🏠 Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 border border-[#3d4a54] hover:border-gray-500 hover:text-white transition-all"
          >
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
}