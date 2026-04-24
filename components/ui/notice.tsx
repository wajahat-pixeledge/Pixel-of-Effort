import { cn } from "@/lib/utils";

interface NoticeProps {
  type: "error" | "message";
  text: string;
}

export function Notice({ type, text }: NoticeProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        type === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/20 bg-primary/10 text-primary"
      )}
    >
      {text}
    </div>
  );
}
