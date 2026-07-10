import {
  ShoppingCart, Home, Zap, Utensils, Car, Film, ShoppingBag,
  Heart, Plane, Briefcase, Laptop, Gift, Plus, Tag, Music,
  Book, Dumbbell, Coffee, PawPrint, Wifi, Gamepad2, Gem,
  GraduationCap, Stethoscope, MoreHorizontal,
  Apple, Baby, Banknote, Beer, Bike, Bus, Calendar, Camera,
  Clock, Cloud, Compass, CreditCard, DollarSign, Eye, Flower,
  Frown, Headphones, Key, Landmark, Lightbulb, Map, Monitor,
  Moon, Palette, Phone, Pill, Scissors, Shirt, Smartphone,
  Smile, Sofa, Star, Store, Sun, Train, Trees, Trophy,
  Tv, Wine, Coins, TrendingUp, PiggyBank, Building2, Building,
  Goal, HandCoins, Vault, Handshake, BadgeJapaneseYen,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  home: Home,
  zap: Zap,
  utensils: Utensils,
  car: Car,
  film: Film,
  "shopping-bag": ShoppingBag,
  "heart-pulse": Heart,
  plane: Plane,
  briefcase: Briefcase,
  laptop: Laptop,
  gift: Gift,
  plus: Plus,
  tag: Tag,
  music: Music,
  book: Book,
  dumbbell: Dumbbell,
  coffee: Coffee,
  "paw-print": PawPrint,
  wifi: Wifi,
  "gamepad-2": Gamepad2,
  gem: Gem,
  "graduation-cap": GraduationCap,
  stethoscope: Stethoscope,
  "more-horizontal": MoreHorizontal,
  apple: Apple,
  baby: Baby,
  banknote: Banknote,
  beer: Beer,
  bike: Bike,
  bus: Bus,
  calendar: Calendar,
  camera: Camera,
  clock: Clock,
  cloud: Cloud,
  compass: Compass,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  eye: Eye,
  flower: Flower,
  frown: Frown,
  headphones: Headphones,
  key: Key,
  landmark: Landmark,
  lightbulb: Lightbulb,
  map: Map,
  monitor: Monitor,
  moon: Moon,
  palette: Palette,
  phone: Phone,
  pill: Pill,
  scissors: Scissors,
  shirt: Shirt,
  smartphone: Smartphone,
  smile: Smile,
  sofa: Sofa,
  star: Star,
  store: Store,
  sun: Sun,
  train: Train,
  tree: Trees,
  trophy: Trophy,
  tv: Tv,
  wine: Wine,
  coins: Coins,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  "building-2": Building2,
  building: Building,
  goal: Goal,
  "hand-coins": HandCoins,
  vault: Vault,
  handshake: Handshake,
  "badge-japanese-yen": BadgeJapaneseYen,
}

export const CATEGORY_ICONS = Object.keys(iconMap)

export function getCategoryIcon(name: string | null, size = 16): React.ReactNode {
  if (!name) return null
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon size={size} />
}

export const ACCOUNT_TYPE_DEFAULT_ICONS: Record<string, string> = {
  checking: "landmark",
  savings: "banknote",
  credit_card: "credit-card",
  cash: "wallet",
  investment: "trending-up",
  other: "coins",
}

function isIconUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")
}

export function getAccountIcon(icon: string | null, type: string, size = 20): React.ReactNode {
  if (!icon) {
    const defaultIcon = ACCOUNT_TYPE_DEFAULT_ICONS[type] || "wallet"
    return getCategoryIcon(defaultIcon, size) || getCategoryIcon("wallet", size)
  }

  if (isIconUrl(icon)) {
    return <img src={icon} alt="" className="w-5 h-5 rounded object-cover" style={{ width: size, height: size }} />
  }

  return getCategoryIcon(icon, size) || getCategoryIcon("wallet", size)
}

export function getTypeIcon(type: string, size = 14): React.ReactNode {
  const iconName = ACCOUNT_TYPE_DEFAULT_ICONS[type] || "wallet"
  return getCategoryIcon(iconName, size)
}
