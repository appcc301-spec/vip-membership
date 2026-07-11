import { Crown, Ticket, Gift, Camera, Star, Headphones } from "lucide-react";

const benefits = [
  { icon: Ticket, title: "Early Ticket Access", desc: "Secure the best seats before the public sale opens." },
  { icon: Gift, title: "Exclusive Merchandise", desc: "Limited edition items only available to VIP members." },
  { icon: Camera, title: "Behind-the-Scenes", desc: "Private videos, studio diaries, and tour galleries." },
  { icon: Star, title: "Meet & Greet", desc: "Invitations to private events and artist meetups." },
  { icon: Crown, title: "VIP Events", desc: "Curated concerts, listening sessions, and private dinners." },
  { icon: Headphones, title: "Digital Downloads", desc: "Unreleased tracks, acoustic sessions, and rare recordings." },
];

export default function BenefitsPage() {
  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair text-gold-gradient mb-4">
            Member Benefits
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            A premium collection of experiences, perks, and exclusive access designed for true fans.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="glassmorphism p-8 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-5">
                  <Icon className="text-gold" size={24} />
                </div>
                <h3 className="text-xl font-playfair text-white mb-3">{b.title}</h3>
                <p className="text-white/70">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
