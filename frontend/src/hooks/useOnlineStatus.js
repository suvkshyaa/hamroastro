import { useEffect } from "react";
import API from "../api";

// ✅ Sends online ping every 30 seconds
export function useOnlineStatus() {
  useEffect(() => {
    const sendOnlinePing = () => {
      API.post('/status/online').catch(() => {});
    };

    // Send immediately on mount
    sendOnlinePing();

    // Then every 30 seconds
    const interval = setInterval(sendOnlinePing, 30000);

    return () => clearInterval(interval);
  }, []);
}