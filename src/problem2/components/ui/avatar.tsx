import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export const Avatar = AvatarPrimitive.Root;

export const AvatarImage = AvatarPrimitive.Image;

export function AvatarFallback({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
