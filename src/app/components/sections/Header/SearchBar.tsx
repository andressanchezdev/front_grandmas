import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  mobile?: boolean;
}

export function SearchBar({ value, onChange, mobile = false }: SearchBarProps) {
  if (mobile) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar ..."
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 pl-9 sm:pl-10 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
        />
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
      <Search className="mr-2 h-5 w-5 text-white/80" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar ..."
        className="w-48 lg:w-64 bg-transparent text-sm text-white placeholder-white/70 focus:outline-none"
      />
    </div>
  );
}
