"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Settings,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "Overview", icon: "Home" },
  { href: "/transactions", label: "Transactions", icon: "ArrowLeftRight" },
];

interface SidebarProfile {
  name: string;
  avatarUrl: string;
}

interface AccountItem {
  id: string;
  name: string;
  balance: number;
  icon: string | null;
  type: string;
}

interface SidebarProps {
  profile: SidebarProfile;
  accounts: AccountItem[];
}

const planningItems = [
  { href: "/bills", label: "Bills", icon: "Repeat" },
  { href: "/goals", label: "Goals", icon: "Target" },
  { href: "/budgets", label: "Budgets", icon: "PieChart" },
  { href: "/categories", label: "Categories", icon: "Tags" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
];

const bottomTabs = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/transactions", label: "Trans.", icon: "ArrowLeftRight" },
];

const iconMap: Record<string, React.ReactNode> = {
  Home: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  ArrowLeftRight: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  ),
  Wallet: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  ),
  Repeat: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  Target: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  PieChart: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  BarChart3: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 16v-3" />
      <path d="M12 16v-6" />
      <path d="M17 16v-8" />
    </svg>
  ),
  Tags: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  ),
};

const bottomIconMap: Record<string, React.ReactNode> = {
  Home: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  ArrowLeftRight: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  ),
  Wallet: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  ),
  Tags: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  ),
  MoreHorizontal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  ),
};

export function Sidebar({ profile, accounts }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [planningOpen, setPlanningOpen] = useState(true);

  const fullName = profile.name;
  const avatarUrl = profile.avatarUrl;

  const initials = fullName ? fullName.charAt(0).toUpperCase() : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-card border-r flex-col z-40">
        <div className="p-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <img src="/icon.png" alt="Imogin" className="w-6 h-6 rounded-md" />
            IMOGIN
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground font-semibold "
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {iconMap[item.icon] || null}
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/accounts"
            className={cn(
              "pt-3 pb-1.5 px-3 flex items-center gap-3 text-sm font-medium transition-colors",
              pathname === "/accounts"
                ? "text-foreground font-semibold "
                : "text-muted-foreground hover:text-accent-foreground",
            )}
          >
            {iconMap["Wallet"] || null}
            Accounts
          </Link>
          <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
            {accounts.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No accounts yet
              </p>
            ) : (
              accounts.map((a) => (
                <Link
                  key={a.id}
                  href={"/accounts/" + a.id}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors",
                    pathname === "/accounts/" + a.id
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {a.icon && (
                      <img
                        src={a.icon}
                        alt=""
                        className="w-4 h-4 rounded object-contain shrink-0"
                      />
                    )}
                    <span className="truncate">{a.name}</span>
                  </span>
                  <span className="shrink-0 ml-2">
                    ¥{Math.abs(a.balance).toLocaleString()}
                  </span>
                </Link>
              ))
            )}
          </div>

          <button
            onClick={() => setPlanningOpen(!planningOpen)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ChevronRight
              size={16}
              className={cn("transition-transform", planningOpen && "rotate-90")}
            />
            Planning
          </button>

          {planningOpen && (
            <div className="ml-4 space-y-1">
              {planningItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "text-foreground font-semibold "
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {iconMap[item.icon] || null}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fullName || "Account"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings size={16} />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
                  {theme === "light" ? (
                    <Sun size={16} />
                  ) : theme === "dark" ? (
                    <Moon size={16} />
                  ) : (
                    <Laptop size={16} />
                  )}
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Sun size={16} /> Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Moon size={16} /> Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Laptop size={16} /> System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-2 z-40 safe-area-pb">
        {bottomTabs.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-0",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {bottomIconMap[item.icon] || null}
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-medium">
                  {initials}
                </div>
              )}
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="w-56 mb-2">
            <DropdownMenuItem asChild>
              <Link
                href="/accounts"
                className="flex items-center gap-2 cursor-pointer"
              >
                {iconMap["Wallet"]}
                Accounts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/categories"
                className="flex items-center gap-2 cursor-pointer"
              >
                {iconMap["Tags"]}
                Categories
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/bills"
                className="flex items-center gap-2 cursor-pointer"
              >
                {iconMap["Repeat"]}
                Bills
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/goals"
                className="flex items-center gap-2 cursor-pointer"
              >
                {iconMap["Target"]}
                Goals
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/budgets"
                className="flex items-center gap-2 cursor-pointer"
              >
                {iconMap["PieChart"]}
                Budgets
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/reports"
                className="flex items-center gap-2 cursor-pointer"
              >
                {iconMap["BarChart3"]}
                Reports
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings size={18} />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={18} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </>
  );
}
