// components/inicial/Footer.tsx
"use client";
import * as React from "react";

interface FooterProps {
  tagline: string;
  brandName: string;
}

export function Footer({ tagline, brandName }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative flex flex-wrap gap-5 justify-between px-8 py-4 w-full bg-gray-800 bg-opacity-80 border-t border-gray-700 max-md:px-5">
      <div className="flex flex-col gap-1">
        <p className="my-auto text-xl text-gray-300 max-md:max-w-full">{tagline}</p>
        <p className="text-sm text-gray-400">
          © {currentYear} {brandName}. Todos los derechos reservados.
        </p>
      </div>
      <div className="text-3xl font-bold text-blue-500 max-md:text-2xl">
        {brandName}
      </div>
    </footer>
  );
}
