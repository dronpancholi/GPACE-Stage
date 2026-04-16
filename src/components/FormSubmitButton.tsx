"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn"; // Assuming cn utility exists, if not I'll just use template strings

interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
}

export function FormSubmitButton({ 
  children, 
  className, 
  pendingText = "Processing...", 
  ...props 
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={cn(
        "relative flex items-center justify-center gap-2",
        pending && "cursor-not-allowed opacity-80",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
