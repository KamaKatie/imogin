import { icons } from "lucide-react";

export const CATEGORY_ICONS = Object.keys(icons);

export function getCategoryIcon(
  name: string | null,
  size = 16,
): React.ReactNode {
  if (!name || !(name in icons)) return null;
  const Icon = icons[name as keyof typeof icons];
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
