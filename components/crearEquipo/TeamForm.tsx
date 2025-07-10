// components/crearEquipo/TeamForm.tsx

"use client";
import * as React from "react";
import { ErrorMessage } from "./ErrorMessage";
import { useRouter } from 'next/router';
import { gql, useQuery, useMutation } from '@apollo/client'; // Importa de Apollo Client

// Definición de las operaciones GraphQL
const GET_STUDENTS_QUERY = gql`
  query GetStudents {
    estudiantes {
      id
      nombre
    }
  }
`;

const CREATE_TEAM_MUTATION = gql`
  mutation CreateTeam($nombre: String!, $equipo_lider_id: ID!) {
    crearEquipo(nombre: $nombre, equipo_lider_id: $equipo_lider_id) {
      id
      nombre
      fecha_creacion
      equipo_lider_id
    }
  }
`;

interface StudentData {
  id: string;
  nombre: string;
}

export function TeamForm() {
  const [teamName, setTeamName] = React.useState<string>('');
  const [leaderId, setLeaderId] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const router = useRouter();

  // Usar useQuery para obtener la lista de estudiantes
  const { data, loading: fetchingStudents, error: studentsErrorApollo } = useQuery<{ estudiantes: StudentData[] }>(GET_STUDENTS_QUERY);

  // Usar useMutation para crear el equipo
  const [createTeam, { loading: creatingTeam, error: createTeamErrorApollo }] = useMutation(CREATE_TEAM_MUTATION, {
    onCompleted: (mutationData) => {
      console.log('Equipo creado exitosamente:', mutationData.crearEquipo);
      setTeamName('');
      // Restablece el líder al primer estudiante si hay alguno después de la creación
      if (data?.estudiantes && data.estudiantes.length > 0) {
        setLeaderId(data.estudiantes[0].id);
      } else {
        setLeaderId('');
      }
      setError('Equipo creado exitosamente!');
      router.push('/equipoCreadoExitosamente');
    },
    onError: (mutationError) => {
      console.error('Error al crear equipo (GraphQL):', mutationError);
      setError(mutationError.message || 'Error al crear el equipo. Inténtalo de nuevo.');
    },
  });

  // Efecto para establecer el líder por defecto cuando los estudiantes se cargan
  React.useEffect(() => {
    if (data?.estudiantes && data.estudiantes.length > 0 && !leaderId) {
      setLeaderId(data.estudiantes[0].id);
    }
  }, [data, leaderId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true); // Controla el estado general del formulario

    if (!teamName.trim()) {
      setError("Por favor ingresa el nombre del equipo.");
      setLoading(false);
      return;
    }

    if (!leaderId) {
      setError("Por favor selecciona un estudiante líder.");
      setLoading(false);
      return;
    }

    try {
      await createTeam({
        variables: {
          nombre: teamName,
          equipo_lider_id: leaderId,
        },
      });
    } catch (err) {
      // Los errores de la mutación ya se manejan en `onError` de `useMutation`
      // Este catch es más para errores inesperados antes de la mutación o si quieres un manejo adicional.
      console.error('Error inesperado antes de la mutación:', err);
      setError(`Error inesperado: ${err instanceof Error ? err.message : String(err)}.`);
    } finally {
      setLoading(false); // Finaliza el estado de carga del formulario
    }
  };

  const students = data?.estudiantes || []; // Obtén los estudiantes del hook useQuery
  const studentsError = studentsErrorApollo ? studentsErrorApollo.message : null; // Mensaje de error para estudiantes
  const formLoading = loading || fetchingStudents || creatingTeam; // Estado de carga combinado

  return (
    <main className="flex flex-col items-center justify-center pt-[100px] w-full text-3xl font-medium max-md:pt-4">
      <section className="w-full max-w-lg p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-4xl font-extrabold text-center text-slate-600 mb-8">
          Nuevo Equipo
        </h2>
        <form onSubmit={handleSubmit} className="w-full">
          <label htmlFor="teamNameInput" className="block mt-4 font-bold text-black">
            Nombre del equipo
          </label>
          <input
            id="teamNameInput"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="flex shrink-0 self-stretch mt-3 rounded-md border border-solid border-stone-300 h-[58px] w-full px-4 py-2 text-xl"
            placeholder="Introduce el nombre del equipo"
            disabled={formLoading}
          />
          <label htmlFor="leaderSelect" className="block mt-8 font-bold text-black">
            Estudiante Líder
          </label>
          {fetchingStudents ? (
            <p className="text-gray-600 text-lg mt-3">Cargando estudiantes...</p>
          ) : studentsError ? (
            <ErrorMessage
              message={`Error al cargar los estudiantes: ${studentsError}`}
              iconSrc="https://cdn.builder.io/api/v1/image/assets/TEMP/efc357ab-d19d-4167-838f-a04ef3d9908f?placeholderIfAbsent=true&apiKey=5c9e6ea2079e4392aa5a607e9bacdc7f"
            />
          ) : (
            <select
              id="leaderSelect"
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              className="flex shrink-0 self-stretch mt-3 rounded-md border border-solid border-stone-300 h-[58px] w-full px-4 py-2 text-xl bg-white appearance-none"
              disabled={formLoading || students.length === 0}
            >
              {students.length === 0 && (
                <option value="">No hay estudiantes disponibles</option>
              )}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nombre}
                </option>
              ))}
            </select>
          )}

          {error && (
            <ErrorMessage
              message={error}
              iconSrc="https://cdn.builder.io/api/v1/image/assets/TEMP/efc357ab-d19d-4167-838f-a04ef3d9908f?placeholderIfAbsent=true&apiKey=5c9e6ea2079e4392aa5a607e9bacdc7f"
            />
          )}
          <button
            type="submit"
            className="px-14 py-3.5 mt-12 text-center text-white whitespace-nowrap rounded-md bg-slate-400 bg-opacity-70 w-full"
            disabled={formLoading}
          >
            {formLoading ? 'Cargando...' : 'Continuar'}
          </button>
        </form>
      </section>
    </main>
  );
}
