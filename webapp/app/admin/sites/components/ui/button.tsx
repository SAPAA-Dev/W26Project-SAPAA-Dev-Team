import React, { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "default" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
}

export function Button({
  children,
  className = "",
  variant = "default",
  ...props
}: PropsWithChildren<ButtonProps>) {
  const base =
    "px-4 py-2 rounded-md text-sm font-medium transition active:scale-[0.98]";

  const variants: Record<ButtonVariant, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
