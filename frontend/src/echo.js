import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// ✅ Safe environment variable access
const getEnv = (key, fallback) => {
    try {
        return import.meta.env[key] || fallback;
    } catch (e) {
        return fallback;
    }
};

// ✅ Detect environment
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === 'localhost';

console.log("🌍 Environment detected:", isLocal ? "LOCAL" : "PRODUCTION");
console.log("🔑 VITE_REVERB_APP_KEY:", getEnv('VITE_REVERB_APP_KEY', 'not-set'));
console.log("🏠 VITE_REVERB_HOST:", getEnv('VITE_REVERB_HOST', 'not-set'));
console.log("🔌 VITE_REVERB_PORT:", getEnv('VITE_REVERB_PORT', 'not-set'));

// ✅ Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
console.log("📱 Device type:", isMobile ? "MOBILE" : "DESKTOP");

const AUTH_ENDPOINT = `${getEnv('VITE_API_URL', isLocal ? 'http://localhost:8000' : 'https://hamroastro.com')}/api/broadcasting/auth`;

// ✅ Configuration with mobile-optimized settings
const config = {
    broadcaster: "reverb",
    key: getEnv('VITE_REVERB_APP_KEY', ''),
    
    wsHost: getEnv('VITE_REVERB_HOST', isLocal ? 'localhost' : 'hamroastro.com'),
    wsPort: parseInt(getEnv('VITE_REVERB_PORT', isLocal ? '8080' : '443')),
    wssPort: parseInt(getEnv('VITE_REVERB_PORT', isLocal ? '8080' : '443')),
    forceTLS: getEnv('VITE_REVERB_SCHEME', isLocal ? 'http' : 'https') === 'https',
    
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    
    // 🔥 MOBILE FIX: Shorter timeouts for faster reconnection
    activityTimeout: isMobile ? 30000 : 120000,  // 30s for mobile vs 2min for desktop
    pongTimeout: isMobile ? 10000 : 30000,        // 10s for mobile vs 30s for desktop
    unavailableTimeout: isMobile ? 3000 : 10000,  // 3s for mobile vs 10s for desktop
    
   authEndpoint: AUTH_ENDPOINT,
    
    auth: {
        headers: {
            Accept: "application/json",
        },
    },

    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                const token = localStorage.getItem("token");

                if (!token) {
                    console.error("❌ No token found in localStorage");
                    callback(new Error("No auth token"), null);
                    return;
                }

                console.log("=== 🔐 CHANNEL AUTHORIZATION ===");
                console.log("Channel:", channel.name);
                console.log("Socket ID:", socketId);
                console.log("================================");

                fetch(AUTH_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                .then(response => {
                    console.log("📡 Auth response status:", response.status);
                    
                    if (!response.ok) {
                        return response.text().then(text => {
                            console.error("❌ Auth failed - Status:", response.status);
                            console.error("❌ Response body:", text);
                            throw new Error(`Auth failed: ${response.status} - ${text}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("✅ Channel authenticated successfully!");
                    callback(null, data);
                })
                .catch(error => {
                    console.error("❌ Authorization error:", error.message);
                    callback(error, null);
                });
            }
        };
    },
};

console.log("=== 🔧 ECHO CONFIGURATION ===");
console.log("Environment:", isLocal ? "LOCAL" : "PRODUCTION");
console.log("Device:", isMobile ? "MOBILE" : "DESKTOP");
console.log("Broadcaster:", config.broadcaster);
console.log("Key:", config.key);
console.log("WS Host:", config.wsHost);
console.log("WS Port:", config.wsPort);
console.log("Force TLS:", config.forceTLS);
console.log("Activity Timeout:", config.activityTimeout + "ms");
console.log("============================");

const echo = new Echo(config);
window.Echo = echo;

// 🔥 MOBILE FIX: Track active channels for reconnection
let activeChannels = new Set();
let isPageVisible = true;
let reconnectTimer = null;

// 🔥 MOBILE FIX: Store channel subscriptions
const originalPrivateMethod = echo.private.bind(echo);
echo.private = function(channel) {
    console.log("📝 Tracking private channel:", channel);
    activeChannels.add(channel);
    return originalPrivateMethod(channel);
};

// 🔥 MOBILE FIX: Handle page visibility changes (mobile background/foreground)
const handleVisibilityChange = () => {
    if (document.hidden) {
        isPageVisible = false;
        console.log("📱 Page hidden (mobile went to background)");
    } else {
        isPageVisible = true;
        console.log("📱 Page visible (mobile came to foreground)");
        
        // Force reconnection check when returning from background
        setTimeout(() => {
            const state = echo.connector.pusher.connection.state;
            console.log("🔍 Connection state on return:", state);
            
            if (state !== 'connected') {
                console.log("🔄 Forcing reconnection...");
                echo.connector.pusher.connect();
            }
        }, 500);
    }
};

if (typeof document.hidden !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    console.log("✅ Visibility change listener registered");
}

// 🔥 MOBILE FIX: Handle mobile-specific events
if (isMobile) {
    // Handle page show (mobile Safari)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log("📱 Page restored from cache");
            setTimeout(() => {
                echo.connector.pusher.connect();
            }, 500);
        }
    });

    // Handle page hide (mobile Safari)
    window.addEventListener('pagehide', () => {
        console.log("📱 Page being cached");
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
        console.log("📱 Device came online");
        setTimeout(() => {
            echo.connector.pusher.connect();
        }, 1000);
    });

    window.addEventListener('offline', () => {
        console.log("📱 Device went offline");
    });
}

// ✅ Connection event listeners with reconnection logic
echo.connector.pusher.connection.bind("connected", () => {
    console.log("=== 💚 WEBSOCKET CONNECTED ===");
    console.log("Socket ID:", echo.socketId());
    console.log("Connection State:", echo.connector.pusher.connection.state);
    console.log("Active Channels:", Array.from(activeChannels));
    console.log("==============================");
    
    // Clear any reconnection timers
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
});

echo.connector.pusher.connection.bind("connecting", () => {
    console.log("🔄 WebSocket connecting...");
});

echo.connector.pusher.connection.bind("disconnected", () => {
    console.log("=== 🔴 WEBSOCKET DISCONNECTED ===");
    
    // 🔥 MOBILE FIX: Auto-reconnect after disconnect
    if (isPageVisible && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
            console.log("🔄 Attempting reconnection...");
            echo.connector.pusher.connect();
        }, isMobile ? 2000 : 5000); // Faster reconnect on mobile
    }
});

echo.connector.pusher.connection.bind("error", (err) => {
    console.error("=== ❌ WEBSOCKET ERROR ===");
    console.error("Error:", err);
    console.error("=========================");
});

echo.connector.pusher.connection.bind("state_change", (states) => {
    console.log("🔄 Connection state:", states.previous, "→", states.current);
});

echo.connector.pusher.connection.bind("unavailable", () => {
    console.error("⚠️ WebSocket connection unavailable");
    
    // 🔥 MOBILE FIX: Try to reconnect when unavailable
    if (isPageVisible && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
            console.log("🔄 Reconnecting after unavailable...");
            echo.connector.pusher.connect();
        }, isMobile ? 3000 : 10000);
    }
});

echo.connector.pusher.connection.bind("failed", () => {
    console.error("💀 WebSocket connection failed - check Reverb server");
});

// 🔥 MOBILE FIX: Periodic connection check (every 30 seconds)
if (isMobile) {
    setInterval(() => {
        if (isPageVisible) {
            const state = echo.connector.pusher.connection.state;
            if (state !== 'connected' && state !== 'connecting') {
                console.log("🔄 Periodic check: Not connected, reconnecting...");
                echo.connector.pusher.connect();
            }
        }
    }, 30000);
}

export default echo;