import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-neutral-800 bg-neutral-900 p-4", className)}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-neutral-400">{children}</div>;
}

export function CardValue({ children }: { children: React.ReactNode }) {
  return <div className="text-2xl font-semibold">{children}</div>;
}
