"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with canvas
const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "#0a0a0f",
        color: "#00ffff",
        fontSize: "18px",
        fontFamily: "sans-serif",
      }}
    >
      Loading...
    </div>
  ),
});

export default function Home() {
  return <Game />;
}
