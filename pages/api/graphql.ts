import { createYoga, createSchema } from 'graphql-yoga';
import { supabase } from '@/lib/supabase'; // Asegúrate de que esta ruta sea correcta

import { NextApiRequest, NextApiResponse } from 'next';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const SECRET_KEY = process.env.JWT_SECRET || "clave_super_segura";


export const config = {
  api: {
    bodyParser: false, // Deshabilita el body parser de Next.js
  },
};

// Define tu esquema GraphQL
const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Usuario {
      nombre: String!
    }

    type Estudiante {
      id: ID!
      nombre: String!
      matricula: String
      usuario: Usuario # Nested user info
    }

    type MiembroEquipo {
      estudiante_id: ID!
      equipos_id: ID!
      estudiante: Estudiante # Nested student info
    }

    type Equipo {
      id: ID!
      nombre: String!
      fecha_creacion: String!
      equipo_lider_id: ID
      miembros: [MiembroEquipo!] # Add members field to Equipo
    }

    type User {
    id: String!
    nombre: String!
    email: String!
  }

  type AuthResponse {
    user: User
    token: String # Aunque el token se guarda en cookie, el frontend podría necesitarlo si lo manejas de otra forma
  }



    type Query {
      estudiantes: [Estudiante!]!
      equipos: [Equipo!]! # Query to fetch all teams
     
      miembroequipo(equipos_id: ID!): [MiembroEquipo!]! # Query to fetch members of a specific team
    }

    type Mutation {
      login(email: String!, contrasena: String!): User
      register(nombre: String!, email: String!, contrasena: String!): User
      crearEquipo(nombre: String!, equipo_lider_id: ID!): Equipo!
      createMiembroEquipo(equipos_id: ID!, estudiante_id: ID!): MiembroEquipo!
      deleteMiembroEquipo(equipos_id: ID!, estudiante_id: ID!): String! # Returns ID of deleted member or success message
    }
  `,
  resolvers: {

    Query: { 
      
      estudiantes: async () => {
        const { data, error } = await supabase
          .from('estudiante')
          .select('id, matricula, usuario(nombre)');

        if (error) {
          console.error("Error fetching students for GraphQL:", error);
          throw new Error(error.message);
        }
        return data.map((item: any) => ({
          id: item.id.toString(),
          nombre: item.usuario?.nombre || 'N/A', // Handle potential null usuario.nombre
          matricula: item.matricula,
          usuario: { nombre: item.usuario?.nombre || 'N/A' }
        }));
      },
      equipos: async () => {
        const { data, error } = await supabase
          .from('equipo')
          .select('id, nombre, fecha_creacion, equipo_lider_id');

        if (error) {
          console.error("Error fetching teams for GraphQL:", error);
          throw new Error(error.message);
        }
        return data;
      },
      miembroequipo: async (_, { equipos_id }) => {
        const { data, error } = await supabase
          .from('miembroequipo')
          .select(
            `
            estudiante_id,
            equipos_id,
            estudiante (
              id,
              matricula,
              usuario (
                nombre
              )
            )
            `
          )
          .eq('equipos_id', equipos_id);

        if (error) {
          console.error("Error fetching team members for GraphQL:", error);
          throw new Error(error.message);
        }

        return data.map((item: any) => ({
          estudiante_id: item.estudiante_id.toString(),
          equipos_id: item.equipos_id.toString(),
          estudiante: {
            id: item.estudiante.id.toString(),
            nombre: item.estudiante.usuario?.nombre || 'N/A',
            matricula: item.estudiante.matricula,
            usuario: { nombre: item.estudiante.usuario?.nombre || 'N/A' }
          }
        }));
      },
    },
    Mutation: {

       login: async (parent: any, { email, contrasena }: any, context: any) => {
      // La lógica de autenticación existente del archivo /api/auth/users.ts
      if (!email || !contrasena) {
        throw new Error("Email y contraseña son requeridos.");
      }

      // Buscar usuario en Supabase
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("id, nombre, email, contrasena")
        .eq("email", email)
        .single();

      if (userError || !userData) {
        throw new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
      }

      // Verificar la contraseña con bcrypt
      const passwordMatch = await bcrypt.compare(contrasena, userData.contrasena);
      if (!passwordMatch) {
        throw new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
      }

      // Generar el token JWT
      const token = jwt.sign(
        { id: userData.id, email: userData.email, nombre: userData.nombre },
        SECRET_KEY,
        { expiresIn: "2h" }
      );

      // Guardar el token en cookies (usando context.res para acceder a la respuesta HTTP)
      if (context.res) {
        context.res.setHeader("Set-Cookie", serialize("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        }));
        console.log("✅ Token guardado en cookies (GraphQL):", token);
      } else {
        console.warn("No se pudo acceder a 'res' en el contexto para establecer la cookie.");
      }


      // Excluir la contraseña antes de responder
      const { contrasena: _, ...userWithoutPassword } = userData;
      return userWithoutPassword;
    },


    register: async (parent: any, { nombre, email, contrasena }: any) => {
        // La lógica de registro existente del archivo de la API REST
        if (!nombre || !email || !contrasena) {
            throw new Error("Todos los campos son requeridos.");
        }

        // Hash de contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Insertar en Supabase
        const { data, error } = await supabase
            .from('usuario')
            .insert([{ nombre, email, contrasena: hashedPassword }])
            .select();

        if (error) {
            // Manejar el error de email duplicado de Supabase (código 23505 para violación de unicidad)
            if (error.code === '23505') {
                throw new Error("El email ya está registrado.");
            }
            throw new Error(error.message || "Error al registrar usuario.");
        }

        // Excluir la contraseña antes de responder
        const { contrasena: _, ...newUser } = data[0];
        return newUser;
    },



      crearEquipo: async (_, { nombre, equipo_lider_id }) => {
        if (typeof nombre !== 'string' || nombre.trim() === '') {
          throw new Error('El nombre del equipo es requerido y debe ser una cadena de texto válida.');
        }

        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from('equipo')
          .insert({
            nombre: nombre,
            fecha_creacion: now,
            equipo_lider_id: equipo_lider_id,
          })
          .select();

        if (error) {
          console.error('Error al insertar equipo para GraphQL:', error.message);
          throw new Error(error.message || 'Error interno del servidor al crear el equipo.');
        }
        return data[0];
      },
      createMiembroEquipo: async (_, { equipos_id, estudiante_id }) => {
        const { data, error } = await supabase
          .from('miembroequipo')
          .insert([
            {
              equipos_id: equipos_id,
              estudiante_id: estudiante_id,
            },
          ])
          .select(
            `
            estudiante_id,
            equipos_id,
            estudiante (
              id,
              matricula,
              usuario (
                nombre
              )
            )
            `
          );

        if (error) {
          console.error('Error al insertar miembro de equipo para GraphQL:', error.message);
          throw new Error(error.message || 'Error interno del servidor al añadir el miembro.');
        }

        const newMember = data[0];
        return {
          estudiante_id: newMember.estudiante_id.toString(),
          equipos_id: newMember.equipos_id.toString(),
          estudiante: {
            id: newMember.estudiante?.[0]?.id?.toString() || 'N/A',
            nombre: newMember.estudiante?.[0]?.usuario?.[0]?.nombre || 'N/A',
            matricula: newMember.estudiante?.[0]?.matricula,
            usuario: { nombre: newMember.estudiante?.[0]?.usuario?.[0]?.nombre || 'N/A' }
          }
        };
      },
      deleteMiembroEquipo: async (_, { equipos_id, estudiante_id }) => {
        const { error } = await supabase
          .from('miembroequipo')
          .delete()
          .eq('equipos_id', equipos_id)
          .eq('estudiante_id', estudiante_id);

        if (error) {
          console.error('Error al eliminar miembro de equipo para GraphQL:', error.message);
          throw new Error(error.message || 'Error interno del servidor al eliminar el miembro.');
        }
        return `Miembro con estudiante_id ${estudiante_id} eliminado del equipo ${equipos_id}`;
      },
    },
    Equipo: {
      miembros: async (parent) => {
        // This resolver will be called if `miembros` is requested on an Equipo
        const { data, error } = await supabase
          .from('miembroequipo')
          .select(
            `
            estudiante_id,
            equipos_id,
            estudiante (
              id,
              matricula,
              usuario (
                nombre
              )
            )
            `
          )
          .eq('equipos_id', parent.id);

        if (error) {
          console.error(`Error fetching members for team ${parent.id}:`, error);
          throw new Error(error.message);
        }
        return data.map((item: any) => ({
          estudiante_id: item.estudiante_id.toString(),
          equipos_id: item.equipos_id.toString(),
          estudiante: {
            id: item.estudiante.id.toString(),
            nombre: item.estudiante.usuario?.nombre || 'N/A',
            matricula: item.estudiante.matricula,
            usuario: { nombre: item.estudiante.usuario?.nombre || 'N/A' }
          }
        }));
      },
    },
  },
});

export default createYoga({
  schema,
  // Deshabilita el GraphiQL en producción para seguridad
  graphqlEndpoint: '/api/graphql',
});