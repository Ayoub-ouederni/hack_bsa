import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={`mx-auto w-full max-w-5xl flex-1 px-4 py-8 ${className ?? ""}`}>
      {children}
    </main>
  );
}
