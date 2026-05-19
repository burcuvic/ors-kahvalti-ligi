"use client";
import { motion } from "framer-motion";

export function Mascot({ size = 180 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "drop-shadow(0 20px 40px rgba(228, 0, 43, 0.4))" }}
    >
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8E8F0" />
        </radialGradient>
        <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF1F4B" />
          <stop offset="50%" stopColor="#E4002B" />
          <stop offset="100%" stopColor="#9F0021" />
        </linearGradient>
        <linearGradient id="capGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF1F4B" />
          <stop offset="100%" stopColor="#9F0021" />
        </linearGradient>
        <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB3C1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF6680" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="120" cy="220" rx="55" ry="8" fill="#000" opacity="0.3" />

      {/* Legs */}
      <rect x="100" y="195" width="8" height="22" rx="4" fill="#FFA52C" />
      <rect x="132" y="195" width="8" height="22" rx="4" fill="#FFA52C" />
      <ellipse cx="104" cy="219" rx="11" ry="4" fill="#FF8C0A" />
      <ellipse cx="136" cy="219" rx="11" ry="4" fill="#FF8C0A" />

      {/* Body (jersey base) */}
      <ellipse cx="120" cy="155" rx="55" ry="48" fill="url(#bodyGrad)" />

      {/* Jersey */}
      <path
        d="M 75 130 Q 75 195 120 200 Q 165 195 165 130 Q 155 120 145 125 L 130 135 Q 120 140 110 135 L 95 125 Q 85 120 75 130 Z"
        fill="url(#jerseyGrad)"
      />
      {/* Jersey collar V */}
      <path
        d="M 110 128 L 120 145 L 130 128 Z"
        fill="#9F0021"
      />
      {/* Jersey ORS logo */}
      <rect x="105" y="155" width="30" height="18" rx="3" fill="#FFD24A" />
      <text
        x="120"
        y="169"
        textAnchor="middle"
        fontFamily="Bebas Neue, sans-serif"
        fontSize="14"
        fontWeight="900"
        fill="#9F0021"
        letterSpacing="1"
      >
        ORS
      </text>
      {/* Jersey number */}
      <text
        x="120"
        y="195"
        textAnchor="middle"
        fontFamily="Bebas Neue, sans-serif"
        fontSize="16"
        fontWeight="900"
        fill="#FFF6E0"
        opacity="0.9"
      >
        10
      </text>

      {/* Wings */}
      <ellipse cx="72" cy="155" rx="14" ry="22" fill="#FFFFFF" transform="rotate(-15 72 155)" />
      <ellipse cx="168" cy="155" rx="14" ry="22" fill="#FFFFFF" transform="rotate(15 168 155)" />

      {/* Head */}
      <circle cx="120" cy="95" r="48" fill="url(#bodyGrad)" />

      {/* Cheeks */}
      <circle cx="92" cy="105" r="12" fill="url(#cheekGrad)" />
      <circle cx="148" cy="105" r="12" fill="url(#cheekGrad)" />

      {/* Eyes */}
      <ellipse cx="105" cy="92" rx="8" ry="10" fill="#FFFFFF" />
      <ellipse cx="135" cy="92" rx="8" ry="10" fill="#FFFFFF" />
      <circle cx="106" cy="94" r="5" fill="#0A0A0F" />
      <circle cx="136" cy="94" r="5" fill="#0A0A0F" />
      <circle cx="107" cy="92" r="1.8" fill="#FFFFFF" />
      <circle cx="137" cy="92" r="1.8" fill="#FFFFFF" />

      {/* Beak */}
      <path
        d="M 115 105 Q 120 117 125 105 Q 122 112 115 105 Z"
        fill="#FFA52C"
        stroke="#C9961B"
        strokeWidth="1"
      />
      <path
        d="M 113 105 L 127 105 L 120 102 Z"
        fill="#FFA52C"
      />

      {/* Smile */}
      <path
        d="M 113 113 Q 120 118 127 113"
        stroke="#9F0021"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Cap */}
      <path
        d="M 75 70 Q 75 50 120 48 Q 165 50 165 70 L 160 75 Q 120 70 80 75 Z"
        fill="url(#capGrad)"
      />
      {/* Cap brim */}
      <path
        d="M 70 72 Q 120 78 170 72 L 168 78 Q 120 84 72 78 Z"
        fill="#9F0021"
      />
      {/* Cap front emblem - ORS */}
      <circle cx="120" cy="60" r="10" fill="#FFD24A" />
      <text
        x="120"
        y="64"
        textAnchor="middle"
        fontFamily="Bebas Neue, sans-serif"
        fontSize="10"
        fontWeight="900"
        fill="#9F0021"
      >
        ORS
      </text>
      {/* Cap top button */}
      <circle cx="120" cy="48" r="3" fill="#FFD24A" />

      {/* Little tuft of feathers above cap */}
      <path d="M 118 45 L 120 38 L 122 45 Z" fill="#FFFFFF" />

      {/* Football at the foot */}
      <circle cx="155" cy="217" r="10" fill="#FFFFFF" stroke="#0A0A0F" strokeWidth="1.5" />
      <path d="M 155 211 L 159 215 L 158 220 L 152 220 L 151 215 Z" fill="#0A0A0F" />
      <line x1="155" y1="207" x2="155" y2="211" stroke="#0A0A0F" strokeWidth="0.8" />
      <line x1="161" y1="213" x2="159" y2="215" stroke="#0A0A0F" strokeWidth="0.8" />
      <line x1="149" y1="213" x2="151" y2="215" stroke="#0A0A0F" strokeWidth="0.8" />
    </motion.svg>
  );
}
