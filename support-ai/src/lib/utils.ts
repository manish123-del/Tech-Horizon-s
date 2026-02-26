export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function safeJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
