import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={`mx-auto w-full max-w-7xl flex-1 px-6 py-8 pb-24 md:pb-8 ${className ?? ""}`}>
      {children}
    </main>
  );
}
