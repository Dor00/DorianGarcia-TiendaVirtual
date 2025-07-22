import React from 'react';

interface SuccessPageProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ 
  title = "¡Operación exitosa!", 
  message, 
  actionLabel, 
  onAction 
}) => {
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-green-400 mb-4">{title}</h2>
        <p className="text-lg mb-6">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </main>
  );
};
