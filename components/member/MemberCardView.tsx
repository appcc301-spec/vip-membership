"use client";

import { useState } from "react";
import { Download, Printer, Wallet, FileText, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VIPCard, CARD_THEMES } from "@/components/VIPCard";
import { cn } from "@/lib/utils";
import { type Member, type CardTheme, MEMBERSHIP_TIERS } from "@/lib/data";
import { QRCodeSVG } from "qrcode.react";

interface MemberCardViewProps {
  member: Member;
}

const themes: CardTheme[] = ["gold", "black", "platinum", "diamond", "emerald"];

export function MemberCardView({ member }: MemberCardViewProps) {
  const [theme, setTheme] = useState<CardTheme>(member.card.theme || "gold");
  const [downloading, setDownloading] = useState(false);

  function getQrDataUrl(): string {
    const svg = document.querySelector("[data-qr-export] svg") as SVGElement | null;
    if (!svg) return "";
    const xml = new XMLSerializer().serializeToString(svg);
    return "data:image/svg+xml;base64," + btoa(xml);
  }

  async function triggerDownload(format: "png" | "pdf") {
    setDownloading(true);
    try {
      const tier = MEMBERSHIP_TIERS.find((x) => x.id === member.membership.tier);
      const { downloadCardCanvas } = await import("@/lib/card-download");
      await downloadCardCanvas(
        {
          memberName: `${member.personal.firstName} ${member.personal.lastName}`,
          email: member.personal.email,
          memberNumber: member.membership.number,
          tier: tier?.name ?? member.membership.tier,
          issueDate: member.card.issueDate,
          expiresDate: member.card.expirationDate,
          status: member.membership.status,
          qrDataUrl: getQrDataUrl(),
          initials: `${member.personal.firstName?.[0] ?? ""}${member.personal.lastName?.[0] ?? ""}`,
        },
        theme,
        format
      );
      toast.success(format === "png" ? "Card image downloaded." : "Card PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const t = CARD_THEMES[theme];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-playfair text-gold-gradient">Your VIP Card</h1>
        <p className="text-white/60 mt-1">Choose a design, download, or print your membership card.</p>
      </div>

      {/* Theme picker */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-gold" />
          <span className="text-sm font-semibold text-white uppercase tracking-widest">Card Theme</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {themes.map((th) => {
            const tc = CARD_THEMES[th];
            return (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={cn(
                  "rounded-xl p-2.5 text-center border-2 transition-all duration-200 flex flex-col items-center gap-2",
                  theme === th ? "border-gold shadow-lg shadow-gold/20" : "border-white/10 hover:border-white/30"
                )}
              >
                <div
                  className="w-full h-8 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${tc.bg1.slice(0,7)} 0%, ${tc.bg2} 50%, ${tc.bg3} 100%)` }}
                />
                <span className="text-[11px] capitalize text-white/70 font-medium">{th}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden QR for export */}
      <div data-qr-export className="hidden">
        <QRCodeSVG
          value={member.card.qrCodeUrl || `https://robertplant-vip.com/verify/${member.membership.number}`}
          size={90}
          level="M"
          bgColor={t.qrBg}
          fgColor={t.qrFg}
        />
      </div>

      {/* Card preview */}
      <div className="flex justify-center px-4">
        <div className="w-full" style={{ maxWidth: 600 }}>
          <VIPCard member={member} theme={theme} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => triggerDownload("png")}
          disabled={downloading}
          className="gap-2 bg-gold text-rich-black hover:bg-gold/90 font-semibold"
        >
          <Download size={16} /> Download PNG
        </Button>
        <Button
          onClick={() => triggerDownload("pdf")}
          disabled={downloading}
          variant="outline"
          className="gap-2"
        >
          <FileText size={16} /> Download PDF
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer size={16} /> Print
        </Button>
        <Button variant="outline" onClick={() => toast.info("Apple Wallet coming soon.")} className="gap-2">
          <Wallet size={16} /> Apple Wallet
        </Button>
        <Button variant="outline" onClick={() => toast.info("Google Wallet coming soon.")} className="gap-2">
          <Wallet size={16} /> Google Wallet
        </Button>
      </div>
    </div>
  );
}
