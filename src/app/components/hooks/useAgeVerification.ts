import { useEffect, useState } from 'react';

export function useAgeVerification() {
  const [mostrarVerificacionEdad, setMostrarVerificacionEdad] = useState(false);
  const [accesoBloqueadoPorEdad, setAccesoBloqueadoPorEdad] = useState(false);

  useEffect(() => {
    try {
      const yaConfirmado = window.sessionStorage.getItem('grandmas_mayor_edad') === '1';
      if (yaConfirmado) return;
    } catch {
      // Ignorar errores de acceso a sessionStorage (modo incognito, etc.)
    }

    const timeoutId = window.setTimeout(() => setMostrarVerificacionEdad(true), 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleConfirmarMayorEdad = () => {
    try {
      window.sessionStorage.setItem('grandmas_mayor_edad', '1');
    } catch {
      // Ignorar errores de acceso a sessionStorage
    }
    setMostrarVerificacionEdad(false);
    setAccesoBloqueadoPorEdad(false);
  };

  const handleRechazarMayorEdad = () => {
    setAccesoBloqueadoPorEdad(true);
  };

  const volverDesdeBloqueo = () => {
    setAccesoBloqueadoPorEdad(false);
  };

  return {
    mostrarVerificacionEdad,
    accesoBloqueadoPorEdad,
    handleConfirmarMayorEdad,
    handleRechazarMayorEdad,
    volverDesdeBloqueo,
  };
}
