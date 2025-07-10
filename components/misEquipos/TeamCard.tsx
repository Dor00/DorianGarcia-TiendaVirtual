//misEquipos/TeamCard.tsx
"use client";
import * as React from "react";

interface TeamData {
  id: number;
  nombre: string;
  memberCount: number;
  createdByName: string;
  createdAt: string;
}

interface TeamCardProps {
  team: TeamData;
  onView: (teamId: number) => void;
  onModify: (teamId: number) => void;
}

export function TeamCard({ team, onView, onModify }: TeamCardProps) {
  const initials = team.nombre.substring(0, 2).toUpperCase();

  return (
    <article className="flex flex-col md:flex-row gap-6 p-6 w-full rounded-md border border-solid border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex-shrink-0">
          <div className="px-7 text-5xl font-semibold text-white whitespace-nowrap rounded-md border border-solid bg-slate-600 border-zinc-500 h-[121px] w-[121px] flex items-center justify-center">
            {initials}
          </div>
        </div>
        
        <div className="flex flex-col">
          <h3 className="text-2xl font-medium text-slate-800">{team.nombre}</h3>
          <p className="text-lg text-slate-600">{team.memberCount} miembros</p>
          <p className="text-lg text-slate-600">Creado por: {team.createdByName}</p>
          <p className="text-lg text-slate-600">Fecha: {team.createdAt}</p>
        </div>
      </div>
      
      <div className="flex gap-3 self-center md:self-auto">        
        
        <button
          className="px-6 py-3 rounded border border-solid border-slate-400 hover:bg-slate-100 transition-colors"
          onClick={() => onModify(team.id)}
        >
          Modificar
        </button>
      </div>
    </article>
  );
}
