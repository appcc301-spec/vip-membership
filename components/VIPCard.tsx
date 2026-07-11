"use client";

import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Member, type CardTheme, MEMBERSHIP_TIERS } from "@/lib/data";

interface VIPCardProps {
  member: Member;
  theme?: CardTheme;
  className?: string;
}

export interface CardThemeConfig {
  bg1: string;
  bg2: string;
  bg3: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  qrBg: string;
  qrFg: string;
  chipBg: string;
  shadow: string;
}

export const CARD_THEMES: Record<CardTheme, CardThemeConfig> = {
  gold: {
    bg1: "#12090030", bg2: "#3d2800", bg3: "#c9a84c",
    accent: "#f0c84a", text: "#fff8e1", muted: "rgba(255,238,160,0.6)",
    border: "rgba(201,168,76,0.45)", qrBg: "#1a1000", qrFg: "#f0c84a",
    chipBg: "#b8960c", shadow: "0 32px 80px rgba(201,168,76,0.45)",
  },
  black: {
    bg1: "#050505", bg2: "#181818", bg3: "#2a2a2a",
    accent: "#c9a84c", text: "#f0f0f0", muted: "rgba(240,240,240,0.5)",
    border: "rgba(201,168,76,0.3)", qrBg: "#050505", qrFg: "#c9a84c",
    chipBg: "#333", shadow: "0 32px 80px rgba(0,0,0,0.85)",
  },
  platinum: {
    bg1: "#141414", bg2: "#3a3a3a", bg3: "#c0c0c0",
    accent: "#d8d8d8", text: "#ffffff", muted: "rgba(255,255,255,0.55)",
    border: "rgba(200,200,200,0.35)", qrBg: "#141414", qrFg: "#d0d0d0",
    chipBg: "#909090", shadow: "0 32px 80px rgba(0,0,0,0.65)",
  },
  diamond: {
    bg1: "#010a1a", bg2: "#0d2550", bg3: "#2260d0",
    accent: "#82c4ff", text: "#e8f4ff", muted: "rgba(180,220,255,0.55)",
    border: "rgba(130,196,255,0.35)", qrBg: "#010a1a", qrFg: "#82c4ff",
    chipBg: "#1a3a6b", shadow: "0 32px 80px rgba(34,96,208,0.5)",
  },
  emerald: {
    bg1: "#010d04", bg2: "#0d3a1a", bg3: "#1e7a40",
    accent: "#4ecb71", text: "#e8fff0", muted: "rgba(150,240,180,0.55)",
    border: "rgba(78,203,113,0.35)", qrBg: "#010d04", qrFg: "#4ecb71",
    chipBg: "#1a5c32", shadow: "0 32px 80px rgba(30,122,64,0.5)",
  },
};

export function VIPCard({ member, theme, className }: VIPCardProps) {
  const activeTheme: CardTheme = theme || member.card.theme || "gold";
  const t = CARD_THEMES[activeTheme];
  const tier = MEMBERSHIP_TIERS.find((x) => x.id === member.membership.tier);
  const initials = `${member.personal.firstName?.[0] ?? ""}${member.personal.lastName?.[0] ?? ""}`;
  const qrValue = member.card.qrCodeUrl || `https://robertplant-vip.com/verify/${member.membership.number}`;

  return (
    <div
      className={cn("relative w-full select-none rounded-[20px] overflow-hidden", className)}
      style={{
        aspectRatio: "85.6 / 54",
        background: `linear-gradient(135deg, ${t.bg1} 0%, ${t.bg2} 45%, ${t.bg3} 100%)`,
        boxShadow: t.shadow,
        minWidth: 0,
      }}
    >
      {/* ── Shine overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, ${t.accent}15 0%, transparent 50%)`,
        }}
      />
      {/* ── Thin border ── */}
      <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${t.border}` }} />

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col p-[5%]">

        {/* Top row */}
        <div className="flex items-start justify-between mb-[4%]">
          <div>
            <p className="text-[clamp(7px,1.3vw,11px)] uppercase tracking-[0.22em] font-medium" style={{ color: t.muted }}>Robert Plant</p>
            <p className="text-[clamp(11px,2vw,18px)] font-playfair font-bold leading-tight" style={{ color: t.text }}>VIP Membership</p>
          </div>
          <div
            className="rounded-full flex items-center justify-center font-bold uppercase tracking-widest"
            style={{
              padding: "3px 10px",
              fontSize: "clamp(7px,1.1vw,10px)",
              border: `1px solid ${t.border}`,
              color: t.accent,
              background: `${t.accent}18`,
              letterSpacing: "0.18em",
            }}
          >
            {tier?.name ?? member.membership.tier}
          </div>
        </div>

        {/* EMV Chip + Name */}
        <div className="flex items-center gap-[3%] mb-[4%]">
          {/* Chip */}
          <div
            className="shrink-0 rounded-[5px]"
            style={{
              width: "clamp(28px,5%,42px)",
              height: "clamp(20px,3.5%,32px)",
              background: `linear-gradient(135deg, ${t.chipBg}aa 0%, ${t.accent}cc 50%, ${t.chipBg}aa 100%)`,
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <div className="absolute inset-[15%] grid grid-cols-3 grid-rows-2 gap-[2px]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-[1px] opacity-50" style={{ background: t.accent }} />
              ))}
            </div>
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <p
              className="font-playfair font-bold truncate leading-tight"
              style={{ fontSize: "clamp(13px,2.6vw,22px)", color: t.text }}
            >
              {member.personal.firstName} {member.personal.lastName}
            </p>
            <p
              className="truncate"
              style={{ fontSize: "clamp(7px,1.2vw,10px)", color: t.muted, marginTop: 2 }}
            >
              {member.personal.email}
            </p>
          </div>

          {/* Avatar */}
          <div
            className="shrink-0 rounded-full flex items-center justify-center font-bold overflow-hidden"
            style={{
              width: "clamp(30px,5.5%,46px)",
              height: "clamp(30px,5.5%,46px)",
              border: `1.5px solid ${t.border}`,
              background: `${t.accent}22`,
              color: t.text,
              fontSize: "clamp(10px,1.5vw,14px)",
            }}
          >
            {member.personal.profilePhoto ? (
              <img src={member.personal.profilePhoto} alt={initials} crossOrigin="anonymous" className="w-full h-full object-cover" />
            ) : initials}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full mb-[4%]" style={{ height: 1, background: t.border }} />

        {/* Bottom row */}
        <div className="flex items-end justify-between flex-1">
          <div style={{ gap: "clamp(6px,2%,14px)", display: "flex", flexDirection: "column" }}>
            {/* Member number */}
            <div>
              <p style={{ fontSize: "clamp(6px,0.9vw,9px)", color: t.muted, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 2 }}>Member Number</p>
              <p style={{ fontSize: "clamp(9px,1.5vw,14px)", color: t.text, fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.12em" }}>{member.membership.number}</p>
            </div>
            {/* Dates */}
            <div style={{ display: "flex", gap: "clamp(10px,3%,24px)" }}>
              <div>
                <p style={{ fontSize: "clamp(6px,0.9vw,9px)", color: t.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2 }}>Issue Date</p>
                <p style={{ fontSize: "clamp(8px,1.2vw,11px)", color: t.text, fontFamily: "monospace" }}>{member.card.issueDate}</p>
              </div>
              <div>
                <p style={{ fontSize: "clamp(6px,0.9vw,9px)", color: t.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2 }}>Expires</p>
                <p style={{ fontSize: "clamp(8px,1.2vw,11px)", color: t.text, fontFamily: "monospace" }}>{member.card.expirationDate}</p>
              </div>
            </div>
            {/* Verified */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={9} style={{ color: t.accent }} />
              <p style={{ fontSize: "clamp(6px,0.85vw,8px)", color: t.muted, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Verified Member · {member.membership.status === "active" ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ padding: 4, background: t.qrBg, border: `1px solid ${t.border}` }}
          >
            <QRCodeSVG
              value={qrValue}
              size={54}
              level="M"
              bgColor={t.qrBg}
              fgColor={t.qrFg}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
