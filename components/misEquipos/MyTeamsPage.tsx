"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { TeamCard } from "./TeamCard";
import { TeamForm } from "../../components/forms/TeamForm"; // Assuming TeamForm also needs refactoring or uses its own API calls

interface Team {
  id: string; // Changed to string to match GraphQL ID type
  nombre: string;
  fecha_creacion: string;
  equipo_lider_id: string; // Changed to string to match GraphQL ID type
  memberCount?: number;
  createdByName?: string; // This will now come from the 'usuario' relation if fetched
  createdAt: string;
}

interface MiembroEquipo {
  estudiante_id: string;
  equipos_id: string;
  estudiante: {
    id: string;
    nombre: string;
    matricula: string;
    usuario: {
      nombre: string;
    };
  };
}

export function MyTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamIdForEdit, setSelectedTeamIdForEdit] = useState<string | null>(null); // Changed to string
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<Team | null>(null);

  const fetchTeamsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetAllTeams {
              equipos {
                id
                nombre
                fecha_creacion
                equipo_lider_id
                miembros {
                  estudiante_id
                  estudiante {
                    usuario {
                      nombre
                    }
                  }
                }
              }
            }
          `,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const fetchedTeams: Team[] = result.data.equipos.map((team: any) => {
        const memberCount = team.miembros ? team.miembros.length : 0;
        
        // This part needs adjustment if you want the 'createdByName' to be the leader's name.
        // For simplicity, I'm setting it to 'Desconocido' as the current GraphQL schema
        // doesn't directly expose the leader's name on the 'Equipo' type easily without another query.
        // If you want the leader's name, you'd need to extend your GraphQL schema or
        // make an additional call to fetch the user's name by equipo_lider_id.
        const createdByName = "Desconocido"; 

        const createdAt = new Date(team.fecha_creacion).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return {
          ...team,
          id: team.id.toString(), // Ensure ID is string
          memberCount,
          createdByName,
          createdAt,
        };
      });

      setTeams(fetchedTeams);
    } catch (err: any) {
      console.error("Error fetching teams data:", err.message);
      setError(`Error al cargar los equipos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsData();
  }, []);


  const handleModifyTeam = (teamId: string) => { 
    setSelectedTeamIdForEdit(teamId);
  };

  const handleCloseEdit = () => {
    setSelectedTeamIdForEdit(null);
    fetchTeamsData(); // Re-fetch teams after closing edit form to update the list
  };

  if (loading) {
    return (
      <main className="flex-1 p-5 overflow-auto h-screen flex justify-center items-center ml-[322px] mt-[88px]">
        <p className="text-xl text-black">Cargando equipos...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-5 overflow-auto h-screen flex justify-center items-center ml-[322px] mt-[88px]">
        <p className="text-xl text-red-600">Error: {error}</p>
      </main>
    );
  }

  if (selectedTeamIdForEdit !== null) {
    return (
      <main className="flex-1 p-5 overflow-auto h-screen ml-[322px] mt-[88px]">
        <h2 className="text-3xl font-bold text-black mb-6">Modificar Equipo</h2>
        {/* Pass the teamIdToEdit to TeamForm so it can fetch the specific team for editing */}
        <TeamForm teamIdToEdit={selectedTeamIdForEdit !== null ? Number(selectedTeamIdForEdit) : null} onCancel={handleCloseEdit} onSave={handleCloseEdit} />
      </main>
    );
  }

  return (
    <main className="flex-1 p-5 overflow-auto h-screen ml-[322px] mt-[88px]">
      <section className="max-w-6xl mx-auto">
        <header className="flex flex-wrap gap-5 justify-between font-medium">
          <h2 className="text-3xl font-bold text-black mb-6">Mis Equipos</h2>
        </header>

        <div className="grid gap-6">
          {teams.length === 0 ? (
            <p className="text-black text-opacity-70">No hay equipos disponibles para mostrar.</p>
          ) : (
            teams.map((team) => (
              <TeamCard
                key={team.id}
                team={{ ...team, id: Number(team.id), memberCount: team.memberCount ?? 0, createdByName: team.createdByName ?? "Desconocido" }}
                onView={() => {}} // Provide a no-op function or implement as needed
                onModify={(teamId: number) => handleModifyTeam(teamId.toString())}
              />
            ))
          )}
        </div>
      </section>

      {showDetailsModal && selectedTeamForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Detalles del Equipo: {selectedTeamForDetails.nombre}</h3>
            <p><strong>ID:</strong> {selectedTeamForDetails.id}</p>
            <p><strong>Miembros:</strong> {selectedTeamForDetails.memberCount}</p>
            <p><strong>Creado por:</strong> {selectedTeamForDetails.createdByName}</p>
            <p><strong>Fecha de Creación:</strong> {selectedTeamForDetails.createdAt}</p>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 bg-slate-400 bg-opacity-70 rounded-md h-[40px] px-4 text-medium text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
