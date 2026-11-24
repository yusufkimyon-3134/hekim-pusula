"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  visibilityLabel?: string;
};

export function PasswordInput({
  className,
  disabled,
  visibilityLabel = "Şifreyi",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("h-11 pr-12 [&::-ms-reveal]:hidden", className)}
      />
      <button
        type="button"
        aria-label={`${visibilityLabel} ${visible ? "gizle" : "göster"}`}
        aria-controls={props.id}
        disabled={disabled}
        onClick={() => setVisible((previous) => !previous)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
