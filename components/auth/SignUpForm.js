import { useState } from "react";
import { useRouter } from 'next/router';
import { FormField } from "./FormField";
import { EmailField } from "./EmailField";

// Definimos el tipo de respuesta para la mutación GraphQL de registro
/**
 * @typedef {Object} RegisterSuccessGraphQLResponse
 * @property {{ register: { id: string, nombre: string, email: string } }} data/**
 * @typedef {Object} RegisterErrorGraphQLResponse
 * @property {Array<{ message: string, extensions?: any, path?: string[] }>} errors
/**
 * @typedef {RegisterSuccessGraphQLResponse | RegisterErrorGraphQLResponse} GraphQLRegisterResponse
 */

export function SignUpForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    confirmarContrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // Nuevo estado para éxito

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false); // Resetear estado de éxito

    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Definición de la mutación GraphQL para el registro
    const REGISTER_MUTATION = `
      mutation Register($nombre: String!, $email: String!, $contrasena: String!) {
        register(nombre: $nombre, email: $email, contrasena: $contrasena) {
          id
          nombre
          email
        }
      }
    `;

    try {
      const response = await fetch('/api/graphql', { // Asume que tu endpoint GraphQL está en /api/graphql
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REGISTER_MUTATION,
          variables: {
            nombre: formData.nombre,
            email: formData.email,
            contrasena: formData.contrasena
          }
        }),
      });

      const data = await response.json();

      // Manejo de errores de red o HTTP (por ejemplo, si el servidor GraphQL no responde)
      if (!response.ok) {
        setError("Error de conexión con el servidor.");
        return;
      }

      // Manejo de errores de GraphQL (si la mutación falla lógicamente)
      if ('errors' in data && data.errors && data.errors.length > 0) {
        setError(data.errors[0].message || 'Error al registrar el usuario.');
        return;
      }

      // Si todo sale bien, la respuesta debe contener 'data' y 'register'
      if ('data' in data && data.data && data.data.register) {
        setSuccess(true);
        setFormData({ // Limpiar el formulario
          nombre: '',
          email: '',
          contrasena: '',
          confirmarContrasena: ''
        });
      } else {
        // En caso de una estructura de respuesta inesperada
        setError("Respuesta inesperada del servidor.");
      }

    } catch (err) {
      console.error("Error en la solicitud GraphQL de registro:", err);
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <FormField 
        label="Nombre"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        required
      />

      <EmailField 
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <FormField
        label="Contraseña"
        type="password"
        name="contrasena"
        value={formData.contrasena}
        onChange={handleChange}
        required
        minLength="6"
      />

      <FormField
        label="Confirmar contraseña"
        type="password"
        name="confirmarContrasena"
        value={formData.confirmarContrasena}
        onChange={handleChange}
        required
      />

      {/* Mensaje de error */}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {/* Mensaje de éxito */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
          ¡Usuario registrado exitosamente!{' '}
          <button 
            onClick={() => router.push('/login?registro=exitoso')}
            className="text-blue-600 hover:underline"
          >
            Ir a login
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || success} // Deshabilitar también cuando es éxito
        className={`w-full text-white py-2 rounded ${
          loading || success ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Registrando...' : success ? 'Registro exitoso' : 'Crear cuenta'}
      </button>
    </form>
  );
}
