import React from "react";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function SubmitButton({ children, className = "" }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={`self-center px-16 pt-7 pb-4 max-w-full text-4xl font-light text-center text-white whitespace-nowrap rounded-md bg-slate-400 w-[396px] max-md:px-5 hover:bg-slate-500 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
