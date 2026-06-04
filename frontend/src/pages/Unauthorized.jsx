import React from "react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Icon */}
        <div className="text-8xl mb-6">🔒</div>

        {/* Error code */}
        <h1 className="text-6xl font-bold text-red-400 mb-4">403</h1>

        {/* Message */}
        <h2 className="text-white text-2xl font-semibold mb-3">
          Access Denied
        </h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          You don't have permission to access this page. Please login with the correct account.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#00a884" }}
          >
            🔑 Go to Login
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