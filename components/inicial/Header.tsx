// components/inicial/Header.tsx
"use client";
import * as React from "react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="relative px-8 py-6 w-full text-5xl font-extrabold text-white bg-gray-800 bg-opacity-80 border-b border-gray-700 max-md:px-5 max-md:text-3xl">
      {title}
    </header>
  );
}
