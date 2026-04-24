import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function toPositiveInt(value: unknown) {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  return Number.parseInt(value, 10);
}
