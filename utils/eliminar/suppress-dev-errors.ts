// utils/suppress-dev-errors.ts
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;

  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (
        args[0].includes('AuthApiError: Invalid login credentials') ||
        args[0].includes('Unhandled Rejection') ||
        args[0].includes('Warning: A component suspended while responding to synchronous input')
      )
    ) {
      // No hagas nada para estos errores específicos en la consola, suprimiéndolos.
      // Puedes descomentar la línea de abajo si quieres ver un aviso silencioso:
      // console.warn('Suppressed development error:', ...args);
      return;
    }
    originalError.apply(console, args);
  };
}