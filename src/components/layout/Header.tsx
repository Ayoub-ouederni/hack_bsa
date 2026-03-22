"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X } from "lucide-react";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { useWallet } from "@/lib/hooks/useWallet";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/fund/create", label: "Create Fund" },
  { href: "/onboarding", label: "Join Fund" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const { isConnected } = useWallet();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF9E6]">
            <Activity className="h-5 w-5 text-[#F5A623]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1A1A2E]">
            Pulse
          </span>
        </Link>

        {/* Desktop nav links — centered */}
        {isConnected && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#FFF9E6] text-[#F5A623]"
                      : "text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side: wallet + mobile menu */}
        <div className="flex items-center gap-2">
          <ConnectWallet />

          {/* Mobile menu toggle */}
          {isConnected && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9E6] text-[#F5A623] transition-colors hover:bg-[#F5A623] hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-100"
          >
            <nav className="px-6 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#FFF9E6] text-[#F5A623]"
                        : "text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
