"use client";
import React, { useState, useEffect } from "react";
import { TeamMemberRow } from "./TeamMemberRow"; // Assuming this component exists

interface TeamMember {
  id: string; // This will be the student's ID, converted to string
  name: string;
  role: string; // Placeholder role, as not present in DB schema provided
}

interface Team {
  id: number;
  nombre: string;
}

interface Student {
  id: number;
  nombre: string;
  matricula: string;
}

export const TeamForm = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState("Nombre del equipo");
  const [newMemberName, setNewMemberName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const GRAPHQL_ENDPOINT = '/api/graphql'; // Your GraphQL endpoint

  // Effect to fetch all teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query {
                equipos {
                  id
                  nombre
                }
              }
            `,
          }),
        });

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const fetchedTeams: Team[] = result.data.equipos;

        if (fetchedTeams && fetchedTeams.length > 0) {
          setTeams(fetchedTeams);
          // Set the first team as default if none is selected
          setSelectedTeamId(fetchedTeams[0].id);
          setSelectedTeamName(fetchedTeams[0].nombre);
        } else {
          setTeams([]);
          setSelectedTeamId(null);
          setSelectedTeamName("No hay equipos disponibles");
        }
      } catch (err: any) {
        console.error("Error fetching teams:", err.message);
        setError(`Error al cargar equipos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Effect to fetch team members and available students when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
      fetchAvailableStudents(selectedTeamId);
    } else {
      setMembers([]); // Clear members if no team is selected
      setAvailableStudents([]); // Clear available students if no team is selected
    }
  }, [selectedTeamId]);

  const fetchTeamMembers = async (teamId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetTeamMembers($teamId: ID!) {
              miembroequipo(equipos_id: $teamId) {
                estudiante_id
                estudiante {
                  id
                  nombre
                }
              }
            }
          `,
          variables: { teamId: teamId.toString() },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const fetchedMembers: TeamMember[] =
        result.data.miembroequipo
          ?.filter(
            (member: any) =>
              member.estudiante &&
              member.estudiante.nombre
          )
          .map((member: any) => ({
            id: member.estudiante_id.toString(),
            name: member.estudiante.nombre,
            role: "Miembro", // Default role
          })) || [];
      setMembers(fetchedMembers);
    } catch (err: any) {
      console.error("Error fetching team members:", err.message);
      setError(`Error al cargar miembros: ${err.message}`);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async (teamId: number) => {
    setLoading(true);
    setError(null);
    try {
      const allStudentsResponse = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              estudiantes {
                id
                nombre
                matricula
              }
            }
          `,
        }),
      });

      const allStudentsResult = await allStudentsResponse.json();

      if (allStudentsResult.errors) {
        throw new Error(allStudentsResult.errors[0].message);
      }

      const allStudents: Student[] = allStudentsResult.data.estudiantes;

      const teamMembersResponse = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetTeamMembersIds($teamId: ID!) {
              miembroequipo(equipos_id: $teamId) {
                estudiante_id
              }
            }
          `,
          variables: { teamId: teamId.toString() },
        }),
      });

      const teamMembersResult = await teamMembersResponse.json();

      if (teamMembersResult.errors) {
        throw new Error(teamMembersResult.errors[0].message);
      }

      const currentMemberIds = new Set(teamMembersResult.data.miembroequipo?.map((m: any) => parseInt(m.estudiante_id)));

      const available =
        allStudents
          ?.filter(
            (student: any) =>
              student.nombre && // Ensure nombre exists
              !currentMemberIds.has(parseInt(student.id))
          )
          .map((student: any) => ({
            id: parseInt(student.id),
            nombre: student.nombre,
            matricula: student.matricula,
          })) || [];
      setAvailableStudents(available);
    } catch (err: any) {
      console.error("Error fetching available students:", err.message);
      setError(`Error al cargar estudiantes disponibles: ${err.message}`);
      setAvailableStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = parseInt(e.target.value);
    setSelectedTeamId(newTeamId);
    const selectedTeam = teams.find((team) => team.id === newTeamId);
    setSelectedTeamName(selectedTeam ? selectedTeam.nombre : "Nombre del equipo");
    setNewMemberName(""); // Clear new member input on team change
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !selectedTeamId) {
      alert("Por favor, selecciona un equipo y escribe el nombre del miembro.");
      return;
    }

    if (members.length >= 3) {
      alert("Se permite un máximo de 3 miembros por equipo.");
      return;
    }

    const studentToAdd = availableStudents.find(
      (student) => student.nombre.toLowerCase() === newMemberName.trim().toLowerCase()
    );

    if (!studentToAdd) {
      alert(
        "Estudiante no encontrado o ya es miembro del equipo. Por favor, asegúrate de escribir el nombre completo del estudiante como aparece en las sugerencias."
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateMiembroEquipo($equipos_id: ID!, $estudiante_id: ID!) {
              createMiembroEquipo(equipos_id: $equipos_id, estudiante_id: $estudiante_id) {
                estudiante_id
              }
            }
          `,
          variables: {
            equipos_id: selectedTeamId.toString(),
            estudiante_id: studentToAdd.id.toString(),
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setNewMemberName(""); // Clear input after adding
      // Re-fetch members and available students to update UI
      await fetchTeamMembers(selectedTeamId);
      await fetchAvailableStudents(selectedTeamId);
    } catch (err: any) {
      console.error("Error adding member:", err.message);
      setError(`Error al añadir miembro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (studentIdString: string) => {
    if (!selectedTeamId) return;

    // Find the member's name for the confirmation message
    const memberToDelete = members.find(member => member.id === studentIdString);
    const memberName = memberToDelete ? memberToDelete.name : "este miembro";

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${memberName} del equipo?`
    );

    if (!confirmDelete) {
      return; // User cancelled the deletion
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation DeleteMiembroEquipo($equipos_id: ID!, $estudiante_id: ID!) {
              deleteMiembroEquipo(equipos_id: $equipos_id, estudiante_id: $estudiante_id)
            }
          `,
          variables: {
            equipos_id: selectedTeamId.toString(),
            estudiante_id: studentIdString,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Re-fetch members and available students to update UI
      await fetchTeamMembers(selectedTeamId);
      await fetchAvailableStudents(selectedTeamId);
    } catch (err: any) {
      console.error("Error deleting member:", err.message);
      setError(`Error al eliminar miembro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (members.length < 2) {
      alert("Un equipo debe tener al menos 2 miembros.");
      return;
    }
    // For this implementation, member additions/deletions are direct DB operations.
    // This button could be used for other form-wide saves if applicable (e.g., team name change).
    // For now, it just logs.
    console.log("Guardando cambios del equipo...", {
      teamName: selectedTeamName,
      members: members,
    });
    alert("Cambios guardados (operaciones de añadir/eliminar son instantáneas).");
  };

  const handleCancel = () => {
    // Optionally re-fetch data to revert any unsaved client-side changes
    // (though in this case, member changes are immediate).
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
      fetchAvailableStudents(selectedTeamId);
    }
    setNewMemberName(""); // Clear any pending new member input
    console.log("Cambios cancelados.");
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-xl text-black">
        Cargando equipos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-xl text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <form className="flex flex-col space-y-8 w-full max-w-[1005px] mx-auto p-4 md:p-0">
      <div>
        <label className="block text-xl font-bold text-black mb-2 md:text-3xl max-sm:text-2xl">
          Nombre del equipo
        </label>
        <div className="relative">
          <select
            value={selectedTeamId || ""}
            onChange={handleTeamChange}
            className="w-full h-[58px] px-4 text-xl text-black border border-solid border-stone-300 rounded-md outline-none md:text-3xl max-sm:text-2xl bg-white"
            disabled={loading}
          >
            {teams.length === 0 ? (
              <option value="" disabled>
                No hay equipos disponibles
              </option>
            ) : (
              teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.nombre}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <section>
        <h3 className="block text-xl font-bold text-black mb-4 md:text-3xl max-sm:text-2xl">
          Miembros
        </h3>
        <div className="flex flex-col space-y-3">
          {members.length === 0 && selectedTeamId && !loading && (
            <p className="text-black text-opacity-70">No hay miembros en este equipo.</p>
          )}
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              name={member.name}
              role={member.role}
              showDelete={true}
              onDelete={() => handleDeleteMember(member.id)}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Añadir miembro..."
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="w-full h-[58px] px-4 text-xl text-black text-opacity-30 border border-solid border-stone-300 rounded-md outline-none md:text-3xl max-sm:text-2xl"
            list="available-students" // Link to datalist for suggestions
            disabled={!selectedTeamId || members.length >= 3 || loading}
          />
          <datalist id="available-students">
            {availableStudents.map((student) => (
              <option key={student.id} value={student.nombre} />
            ))}
          </datalist>
        </div>
        <button
          type="button"
          onClick={handleAddMember}
          className="bg-transparent border border-solid border-slate-400 rounded h-[58px] px-6 text-xl font-medium text-black text-opacity-50 md:w-[121px] max-sm:text-xl
                        disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedTeamId || members.length >= 3 || !newMemberName.trim() || loading}
        >
          Añadir
        </button>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mt-8">
        <button
          type="button"
          onClick={handleSave}
          className="bg-slate-400 bg-opacity-70 rounded-md h-[62px] px-6 text-xl font-medium text-white md:w-[268px] max-sm:text-2xl
                        disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || members.length < 2} // Disable if less than 2 members
        >
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="bg-transparent border border-solid border-slate-400 rounded-md h-[62px] px-6 text-xl font-medium text-black md:w-[172px] max-sm:text-2xl
                        disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
