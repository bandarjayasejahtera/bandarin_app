'use client'

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean; // Manual loading state override
  className?: string;
}

export function SubmitButton({ children, isLoading, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isSubmitting = isLoading || pending;

  return (
    <Button
      type="submit"
      disabled={isSubmitting || props.disabled}
      className={cn(className)}
      {...props}
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
