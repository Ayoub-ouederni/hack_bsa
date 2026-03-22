"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  UserPlus,
  User,
  Activity,
} from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";

const sidebarLinks = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/fund/create", icon: Plus, label: "Create" },
  { href: "/onboarding", icon: UserPlus, label: "Join" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const { isConnected } = useWallet();
  const pathname = usePathname();

  if (!isConnected) return null;

  return (
    <>
      {/* Desktop sidebar — fixed left */}
      <aside className="hidden md:flex flex-col items-center w-[72px] shrink-0 border-r border-gray-100 bg-white py-6 gap-2 sticky top-16 h-[calc(100vh-4rem)]">
        {/* Logo icon at top */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9E6] mb-4">
          <Activity className="h-5 w-5 text-[#F5A623]" />
        </div>

        {/* Nav icons */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-[#FFF9E6] text-[#F5A623] shadow-sm"
                    : "text-[#6B7280] hover:bg-gray-50 hover:text-[#1A1A2E]"
                }`}
              >
                <link.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "text-[#F5A623]"
                    : "text-[#6B7280] hover:text-[#1A1A2E]"
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
