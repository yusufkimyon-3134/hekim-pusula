import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Users,
  BedDouble,
  Banknote,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface UpcomingInfoItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const UPCOMING_INFO_ITEMS: UpcomingInfoItem[] = [
  {
    icon: CalendarClock,
    title: "Aylık nöbet sayısı",
    description: "Ortalama nöbet sıklığı ve yoğunluğu.",
  },
  {
    icon: Users,
    title: "Günlük hasta yoğunluğu",
    description: "Poliklinikte günlük ortalama hasta sayısı.",
  },
  {
    icon: BedDouble,
    title: "Servis iş yükü",
    description: "Yatan hasta takibinin getirdiği yük.",
  },
  {
    icon: Banknote,
    title: "Döner sermaye / ek ödeme",
    description: "Ek ödemelerin düzenliliği ve seviyesi.",
  },
  {
    icon: ClipboardCheck,
    title: "Yönetim kalitesi",
    description: "İdarenin tutumu ve iletişim şeffaflığı.",
  },
  {
    icon: Building2,
    title: "Çalışma ortamı",
    description: "Fiziki koşullar ve ekip atmosferi.",
  },
];

function UpcomingInfoCard({ icon: Icon, title, description }: UpcomingInfoItem) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
          <Icon className="size-4.5 text-accent-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{title}</p>
            <Badge variant="soft" className="shrink-0 text-[10px]">
              Yakında
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingInfoGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {UPCOMING_INFO_ITEMS.map((item) => (
        <UpcomingInfoCard key={item.title} {...item} />
      ))}
    </div>
  );
}
