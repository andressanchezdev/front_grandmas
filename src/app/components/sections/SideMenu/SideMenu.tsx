import React from 'react';
import {
  FileText,
  House,
  LayoutGrid,
  ListFilter,
  Phone,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { LOGO_URL, UserData } from '../../hooks/landingShared';

interface SideMenuProps {
  isOpen: boolean;
  user?: UserData;
  categorias: string[];
  categoriasExpanded: boolean;
  categoriaSeleccionada: string;
  onClose: () => void;
  onToggleCategorias: () => void;
  onCategoriaClick: (categoria: string) => void;
  onSectionShortcut: (sectionId: 'inicio' | 'productos' | 'contacto') => void;
  onOpenProfile: () => void;
  onOpenOrders: () => void;
  onNavigateToNosotros: () => void;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onLogout: () => void;
}

export function SideMenu({
  isOpen,
  user,
  categorias,
  categoriasExpanded,
  categoriaSeleccionada,
  onClose,
  onToggleCategorias,
  onCategoriaClick,
  onSectionShortcut,
  onOpenProfile,
  onOpenOrders,
  onNavigateToNosotros,
  onNavigateToLogin,
  onNavigateToRegister,
  onLogout,
}: SideMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed left-0 top-0 h-full w-64 sm:w-72 md:w-80 bg-primary text-white z-50 shadow-xl overflow-y-auto sidebar-menu-scroll">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={LOGO_URL}
                  alt="Grandma's Liqueurs Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-white">Menú</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => onSectionShortcut('inicio')}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-white/10 transition-colors"
            >
              <House className="h-5 w-5" />
              Inicio
            </button>
            <button
              onClick={() => onSectionShortcut('productos')}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-white/10 transition-colors"
            >
              <LayoutGrid className="h-5 w-5" />
              Productos
            </button>

            <div>
              <button
                onClick={onToggleCategorias}
                className="w-full flex items-center justify-between rounded-lg px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <ListFilter className="h-5 w-5" />
                  Categorías
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${categoriasExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {categoriasExpanded && (
                <div className="ml-4 mt-2 space-y-1">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria}
                      onClick={() => onCategoriaClick(categoria)}
                      className={`block w-full rounded-lg px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                        categoriaSeleccionada === categoria ? 'bg-white/20' : ''
                      }`}
                    >
                      {categoria === 'Todos' ? 'Todas las categorías' : categoria}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/20 my-4" />

            {user && (
              <>
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Mi Perfil
                </button>
                <button
                  onClick={onOpenOrders}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Mis Pedidos
                </button>
              </>
            )}

            <a
              href="#contacto"
              onClick={() => onSectionShortcut('contacto')}
              className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Contacto
            </a>
            <button
              onClick={onNavigateToNosotros}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-white/10 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Nosotros
            </button>

            <div className="pt-4 space-y-2 sm:hidden">
              {user ? (
                <>
                  <button
                    onClick={onOpenOrders}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left"
                  >
                    Mis Pedidos
                  </button>
                  <div className="px-4 py-3 rounded-lg bg-white/10">
                    <p className="text-sm">
                      {user.nombre} {user.apellido}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onNavigateToLogin}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={onNavigateToRegister}
                    className="w-full px-4 py-3 rounded-lg bg-white text-primary hover:bg-white/90 transition-colors text-left"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
