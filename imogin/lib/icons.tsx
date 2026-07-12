import {
  Landmark,
  Banknote,
  CreditCard,
  Wallet,
  TrendingUp,
  Coins,
  Home,
  ArrowLeftRight,
  Repeat,
  Target,
  PieChart,
  BarChart3,
  Tags,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Settings,
  Sun,
  Moon,
  Laptop,
  GripVertical,
  Search,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Check,
  Circle,
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Heart,
  GraduationCap,
  Plane,
  Zap,
  Wifi,
  Phone,
  Coffee,
  Gift,
  Briefcase,
  Music,
  Film,
  BookOpen,
  Dumbbell,
  Shirt,
  Baby,
  Dog,
  Stethoscope,
  Building,
  DollarSign,
  Building2,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Receipt,
  PiggyBank,
  HandCoins,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const iconMap: Record<string, IconComponent> = {
  landmark: Landmark,
  banknote: Banknote,
  "credit-card": CreditCard,
  wallet: Wallet,
  "trending-up": TrendingUp,
  coins: Coins,
  home: Home,
  "arrow-left-right": ArrowLeftRight,
  repeat: Repeat,
  target: Target,
  "pie-chart": PieChart,
  "bar-chart": BarChart3,
  tags: Tags,
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "log-out": LogOut,
  settings: Settings,
  sun: Sun,
  moon: Moon,
  laptop: Laptop,
  "grip-vertical": GripVertical,
  search: Search,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  plus: Plus,
  x: X,
  check: Check,
  circle: Circle,
  "shopping-cart": ShoppingCart,
  "utensils-crossed": UtensilsCrossed,
  car: Car,
  heart: Heart,
  "graduation-cap": GraduationCap,
  plane: Plane,
  zap: Zap,
  wifi: Wifi,
  phone: Phone,
  coffee: Coffee,
  gift: Gift,
  briefcase: Briefcase,
  music: Music,
  film: Film,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  shirt: Shirt,
  baby: Baby,
  dog: Dog,
  stethoscope: Stethoscope,
  building: Building,
  "dollar-sign": DollarSign,
  "building-2": Building2,
  "map-pin": MapPin,
  clock: Clock,
  calendar: Calendar,
  "file-text": FileText,
  receipt: Receipt,
  "piggy-bank": PiggyBank,
  "hand-coins": HandCoins,
};

export const CATEGORY_ICONS = Object.keys(iconMap);

export function getCategoryIcon(
  name: string | null,
  size = 16,
): React.ReactNode {
  if (!name) return null;
  const key = name.toLowerCase().replace(/\s+/g, "-");
  const Icon = iconMap[key];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export function searchIcons(query: string): string[] {
  return CATEGORY_ICONS.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );
}

export const ACCOUNT_TYPE_DEFAULT_ICONS: Record<string, string> = {
  checking: "landmark",
  savings: "banknote",
  credit_card: "credit-card",
  cash: "wallet",
  investment: "trending-up",
  other: "coins",
};

export const GOAL_ICON_OPTIONS = [
  { key: "target", label: "Target" },
  { key: "coins", label: "Money" },
  { key: "home", label: "House" },
  { key: "plane", label: "Travel" },
  { key: "car", label: "Car" },
  { key: "piggy-bank", label: "Savings" },
  { key: "gift", label: "Gift" },
  { key: "heart", label: "Health" },
  { key: "graduation-cap", label: "Education" },
  { key: "dumbbell", label: "Fitness" },
  { key: "briefcase", label: "Career" },
  { key: "coffee", label: "Lifestyle" },
] as const;

export const ACCOUNT_ICON_OPTIONS = [
  { key: "landmark", label: "Bank" },
  { key: "credit-card", label: "Credit" },
  { key: "wallet", label: "Wallet" },
  { key: "banknote", label: "Cash" },
  { key: "trending-up", label: "Invest" },
  { key: "coins", label: "Coins" },
  { key: "piggy-bank", label: "Savings" },
  { key: "shopping-cart", label: "Shopping" },
  { key: "home", label: "Home" },
  { key: "car", label: "Car" },
  { key: "plane", label: "Travel" },
  { key: "heart", label: "Health" },
  { key: "graduation-cap", label: "Education" },
  { key: "dumbbell", label: "Fitness" },
  { key: "briefcase", label: "Career" },
  { key: "coffee", label: "Lifestyle" },
] as const;

function isIconUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  );
}

export function getAccountIcon(
  icon: string | null,
  type: string,
  size = 20,
): React.ReactNode {
  if (!icon) {
    const defaultIcon = ACCOUNT_TYPE_DEFAULT_ICONS[type] || "wallet";
    return (
      getCategoryIcon(defaultIcon, size) || getCategoryIcon("wallet", size)
    );
  }

  if (isIconUrl(icon)) {
    return (
      <img
        src={icon}
        alt=""
        className="w-5 h-5 rounded object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return getCategoryIcon(icon, size) || getCategoryIcon("wallet", size);
}

export function getTypeIcon(type: string, size = 14): React.ReactNode {
  const iconName = ACCOUNT_TYPE_DEFAULT_ICONS[type] || "wallet";
  return getCategoryIcon(iconName, size);
}
