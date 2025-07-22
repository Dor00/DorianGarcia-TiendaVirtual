import React from 'react';

interface ErrorPageProps {
  message: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ message }) => {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-red-500 mb-4">Ocurrió un error</h2>
        <p className="text-lg">{message}</p>
      </div>
    </main>
  );
};
