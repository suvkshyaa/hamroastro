import React from "react";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
      <div className="text-center">

        {/* Spinning planet */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#2a3942] border-t-[#00a884] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🌟
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-400 text-sm">{message}</p>
        
        {/* Dots animation */}
        <div className="flex justify-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#00a884]"
              style={{
                animation: "bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}