import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    q: "How do I become a VIP member?",
    a: "Memberships are invitation-only and created by our administrator team. If you have been selected, you will receive a welcome email with your login credentials.",
  },
  {
    q: "Can I register myself?",
    a: "No. Visitors cannot create their own accounts. The administrator creates and manages every VIP membership.",
  },
  {
    q: "What do I receive as a member?",
    a: "A personalized digital VIP card, early ticket access, exclusive content, VIP events, and tier-specific benefits.",
  },
  {
    q: "How do I download my VIP card?",
    a: "Log into the member portal, visit the My Card page, and download your card as an image or PDF.",
  },
];

export default function FAQPage() {
  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair text-gold-gradient mb-4">Frequently Asked Questions</h1>
          <p className="text-white/70">Everything you need to know about the VIP membership experience.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-white/70">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
