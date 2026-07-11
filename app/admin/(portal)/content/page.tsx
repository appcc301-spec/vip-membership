import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Image, Music, FileText } from "lucide-react";
import { EXCLUSIVE_CONTENT } from "@/lib/data";

const icons: Record<string, typeof Video> = {
  video: Video,
  photo: Image,
  audio: Music,
  article: FileText,
};

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Content</h1>
          <p className="text-white/60">Manage exclusive member content.</p>
        </div>
        <Button>Add Content</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXCLUSIVE_CONTENT.map((content) => {
          const Icon = icons[content.type] || FileText;
          return (
            <Card key={content.id} className="bg-white/5 border-white/10 overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover" />
              </div>
              <CardHeader>
                <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
                  <Icon size={18} className="text-gold" /> {content.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">{content.excerpt}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
