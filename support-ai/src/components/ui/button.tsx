import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-neutral-200"
      : variant === "secondary"
      ? "bg-neutral-800 text-white hover:bg-neutral-700"
      : "bg-transparent text-white hover:bg-neutral-800";
  return <button className={cn(base, styles, className)} {...props} />;
}
