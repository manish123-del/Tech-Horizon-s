import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  intent?: "neutral" | "positive" | "negative" | "frustrated" | "low" | "medium" | "high" | "critical";
  className?: string;
};

export function Badge({ children, intent = "neutral", className }: Props) {
  const styles: Record<string, string> = {
    neutral: "bg-neutral-800 text-neutral-200",
    positive: "bg-green-600 text-white",
    negative: "bg-red-600 text-white",
    frustrated: "bg-orange-600 text-white",
    low: "bg-neutral-700 text-white",
    medium: "bg-yellow-600 text-black",
    high: "bg-red-700 text-white",
    critical: "bg-red-900 text-white"
  };
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs", styles[intent], className)}>
      {children}
    </span>
  );
}
