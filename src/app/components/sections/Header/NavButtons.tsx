import React from 'react';
import { FileEdit, LogOut, ShoppingCart, User } from 'lucide-react';
import { UserData } from '../../hooks/landingShared';

interface NavButtonsProps {
  user?: UserData;
  cantidadItemsCarrito: number;
  onOpenProfile: () => void;
  onLogout: () => void;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onOpenCart: () => void;
}

export function NavButtons({
  user,
  cantidadItemsCarrito,
  onOpenProfile,
  onLogout,
  onNavigateToLogin,
  onNavigateToRegister,
  onOpenCart,
}: NavButtonsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      {user ? (
        <>
          <button
            onClick={onOpenProfile}
            className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
            title="Mi perfil"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate max-w-[80px] md:max-w-none">
              {user.nombre}
            </span>
          </button>

          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 group overflow-hidden"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap text-xs sm:text-sm">
              Cerrar Sesión
            </span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onNavigateToLogin}
            className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 group overflow-hidden"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap text-xs sm:text-sm">
              Iniciar Sesión
            </span>
          </button>

          <button
            onClick={onNavigateToRegister}
            className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 group overflow-hidden"
          >
            <FileEdit className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap text-xs sm:text-sm">
              Registrarse
            </span>
          </button>
        </>
      )}

      <button
        onClick={onOpenCart}
        className="relative p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
        {cantidadItemsCarrito > 0 && (
          <>
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border border-primary/20 bg-white" />
            </span>
            <span className="sr-only">Carrito con productos</span>
          </>
        )}
      </button>
    </div>
  );
}
