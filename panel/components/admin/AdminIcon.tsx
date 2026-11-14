import {
  Bell,
  Box,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  Flame,
  Globe,
  History,
  House,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MoreHorizontal,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  PanelsTopLeft,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  UploadCloud,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  grid: LayoutDashboard,
  home: House,
  bag: ShoppingBag,
  box: Box,
  users: UsersRound,
  layers: Layers3,
  chart: ChartNoAxesColumnIncreasing,
  search: Search,
  bell: Bell,
  chev: ChevronRight,
  "chev-down": ChevronDown,
  menu: Menu,
  calendar: CalendarDays,
  store: Store,
  upload: UploadCloud,
  shield: ShieldCheck,
  history: History,
  database: Database,
  megaphone: Megaphone,
  settings: Settings,
  globe: Globe,
  panels: PanelsTopLeft,
  file: FileText,
  message: MessageSquare,
  video: Video,
  flame: Flame,
  logout: LogOut,
  more: MoreHorizontal,
  mail: Mail,
  lock: LockKeyhole,
  info: CircleHelp,
};

export default function AdminIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name] ?? CircleHelp;
  return (
    <Icon
      aria-hidden="true"
      size={size}
      strokeWidth={1.7}
      className={className}
    />
  );
}
