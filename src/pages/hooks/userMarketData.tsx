import { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "https://capital-server-gnsu.onrender.com";
const SECRET_KEY = "aurify@123";

export default function useMarketData(symbols = ["GOLD"]) {
  const [marketData, setMarketData] = useState<any>(null);
  const socketRef = useRef<any>(null);

  const handleMarketData = useCallback((data: any) => {
    if (data?.symbol?.toLowerCase() === "gold") {
      setMarketData(data);
    }
  }, []);

  useEffect(() => {
    console.log("📡 Connecting to WebSocket...");
    
    // Initialize socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      query: { secret: SECRET_KEY },
      transports: ["websocket"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      socket.emit("request-data", symbols);
    });

    socket.on("market-data", handleMarketData);
    socket.on("error", (error: any) => console.error("❌ WebSocket error:", error));

    return () => {
      console.log("🔌 Disconnecting WebSocket...");
      if (socket) socket.disconnect();
    };
  }, [handleMarketData, symbols]);

  return { marketData };
}