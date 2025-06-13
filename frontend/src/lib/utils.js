// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Un “class-name” helper che combina più classi e unisce duplicati Tailwind.
 * Uso: className={cn("p-4", condition && "text-red-500", "bg-white")}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
