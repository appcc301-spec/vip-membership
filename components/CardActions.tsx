"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { Download, Printer, Wallet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type Member } from "@/lib/data";

interface CardActionsProps {
  member: Member;
}

export function CardActions({ member }: CardActionsProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
    saveAs(dataUrl, `${member.membership.number}-vip-card.png`);
    toast.success("Card image downloaded.");
  }

  async function downloadPdf() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [600, 380] });
    pdf.addImage(dataUrl, "PNG", 0, 0, 600, 380);
    pdf.save(`${member.membership.number}-vip-card.pdf`);
    toast.success("Card PDF downloaded.");
  }

  function printCard() {
    window.print();
  }

  return (
    <div>
      <div ref={cardRef} className="hidden print:block">
        {/* Hidden print-only duplicate for printing */}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={downloadPng} className="gap-2">
          <Download size={18} /> Download Image
        </Button>
        <Button variant="outline" onClick={downloadPdf} className="gap-2">
          <FileText size={18} /> Download PDF
        </Button>
        <Button variant="outline" onClick={printCard} className="gap-2">
          <Printer size={18} /> Print Card
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Apple Wallet support coming soon.")}>
          <Wallet size={18} /> Apple Wallet
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Google Wallet support coming soon.")}>
          <Wallet size={18} /> Google Wallet
        </Button>
      </div>
    </div>
  );
}
