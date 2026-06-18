import React from 'react';
import { Button } from '../Button';
import { LOGO_URL } from '../hooks/landingShared';

interface AgeVerificationModalProps {
  isOpen: boolean;
  accesoBloqueadoPorEdad: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onBack: () => void;
}

export function AgeVerificationModal({
  isOpen,
  accesoBloqueadoPorEdad,
  onConfirm,
  onReject,
  onBack,
}: AgeVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verificacion-edad-titulo"
      >
        <div className="bg-primary text-white px-6 py-5 flex flex-col items-center text-center gap-2">
          <img src={LOGO_URL} alt="Grandma's Liquors" className="w-14 h-14 rounded-full bg-white/10 p-1" />
          <h2 id="verificacion-edad-titulo" className="text-lg sm:text-xl font-semibold">
            Verificacion de edad
          </h2>
        </div>

        <div className="p-6 text-center space-y-4">
          {!accesoBloqueadoPorEdad ? (
            <>
              <p className="text-base text-foreground">Confirmo que soy mayor de edad</p>
              <p className="text-sm text-muted-foreground">
                El consumo de bebidas alcoholicas es exclusivo para personas mayores de 18 anos. El
                exceso de alcohol es perjudicial para la salud.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onReject}>
                  No
                </Button>
                <Button className="flex-1" onClick={onConfirm}>
                  Si
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-base text-foreground font-medium">Acceso restringido</p>
              <p className="text-sm text-muted-foreground">
                Lo sentimos, debes ser mayor de edad para ingresar a Grandma&apos;s Liquors. Si te
                equivocaste, puedes confirmar tu mayoria de edad para continuar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                  Volver
                </Button>
                <Button className="flex-1" onClick={onConfirm}>
                  Soy mayor de edad
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
