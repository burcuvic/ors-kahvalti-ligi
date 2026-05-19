"use client";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  shape: "square" | "circle" | "ball";
  rotate: number;
}

const COLORS = ["#E4002B", "#FFD24A", "#FFFFFF", "#FF1F4B", "#C9961B"];

export function Confetti({ count = 30 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const arr: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 8,
      size: 6 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: (["square", "circle", "ball"] as const)[Math.floor(Math.random() * 3)],
      rotate: Math.random() * 360,
    }));
    setParticles(arr);
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: `-10%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.shape === "ball" ? "#FFFFFF" : p.color,
            borderRadius: p.shape === "circle" || p.shape === "ball" ? "50%" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.7,
            boxShadow: p.shape === "ball" ? "inset -2px -2px 0 #0A0A0F" : "none",
          }}
        />
      ))}
    </div>
  );
}

export function StadiumLights() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -top-32 left-[10%] w-[400px] h-[400px] rounded-full animate-stadium-flicker"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute -top-32 right-[10%] w-[400px] h-[400px] rounded-full animate-stadium-flicker"
        style={{
          background:
            "radial-gradient(circle, rgba(255,210,74,0.12) 0%, transparent 60%)",
          animationDelay: "1s",
        }}
      />
      <div
        className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(228,0,43,0.08) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
