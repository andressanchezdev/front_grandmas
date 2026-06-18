import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, Column, commonActions } from '../../DataTable';
import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { Form, FormField, FormActions, FieldError, FieldHelper } from '../../Form';
import { Plus, Shield, Check, X } from 'lucide-react';
import { useAlertDialog } from '../../AlertDialog';
import { api } from '../../../services/api';
import {
  STAFF_MODULES,
  ALL_SUB_GESTION_IDS,
  collapseToGestiones,
  expandGestiones,
  isModuleFullySelected,
  toggleModuleInSelection,
  toggleSubGestionInSelection,
  type StaffSubGestionId,
} from '../../../services/routePermissions';
import { toast } from '../../AlertDialog';

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: string[];
  estado: 'Activo' | 'Inactivo';
  usuarios: number;
}

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedGestiones, setSelectedGestiones] = useState<StaffSubGestionId[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    gestiones: [] as StaffSubGestionId[]
  });
  // Estado de validación inline para el campo "Nombre del Rol".
  const [nombreError, setNombreError] = useState<string>('');
  const [showEditPermisosNote, setShowEditPermisosNote] = useState(true);
  const { showAlert, AlertComponent } = useAlertDialog();

  // Valida el nombre del rol localmente con mensajes claros para el usuario.
  // Devuelve string vacío si es válido, o el mensaje a mostrar.
  const validarNombreRol = (nombreRaw: string, idActual?: number): string => {
    const nombre = nombreRaw.trim();
    if (!nombre) return 'El nombre del rol es obligatorio.';
    if (nombre.length < 3) return `Faltan ${3 - nombre.length} carácter(es). Mínimo 3.`;
    if (nombre.length > 50) return 'El nombre no puede superar los 50 caracteres.';
    if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s_\-]+$/.test(nombre)) {
      return 'Solo se permiten letras, números, espacios, guiones (-) o guion bajo (_).';
    }
    const repetido = roles.some(
      (r) => r.nombre.toLowerCase() === nombre.toLowerCase() && r.id !== idActual
    );
    if (repetido) return `Ya existe un rol con el nombre "${nombre}". Elija un nombre diferente.`;
    return '';
  };

  const cargarRoles = async () => {
    try {
      setLoading(true);
      const data = await api.roles.getAll();
      const mapped = (Array.isArray(data) ? data : []).map((r: any) => ({
        id: Number(r.id),
        nombre: String(r.nombre || ''),
        descripcion: String(r.descripcion || ''),
        permisos: Array.isArray(r.permisos) ? r.permisos : [],
        estado: String(r.estado || 'Activo') === 'Inactivo' ? 'Inactivo' : 'Activo',
        usuarios: Number(r.usuarios ?? 0),
      })) as Role[];
      setRoles(mapped);
    } catch (error: any) {
      toast.error('Error al cargar roles', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const columns: Column[] = [
    { key: 'nombre', label: 'Rol' },
    { key: 'descripcion', label: 'Descripción' },
    { 
      key: 'permisos', 
      label: 'Gestiones asignadas',
      render: (permisos: string[]) => {
        const gestiones = collapseToGestiones(permisos);
        return (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">
              {gestiones.length} gestión{gestiones.length !== 1 ? 'es' : ''}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'usuarios', 
      label: 'Usuarios',
      render: (value: number) => `${value} usuario${value !== 1 ? 's' : ''}`
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (estado: string, role: Role) => (
        <select
          value={estado}
          onChange={(e) => handleEstadoChange(role.id, e.target.value as 'Activo' | 'Inactivo')}
          className="px-3 py-1 rounded-full text-xs border-0 cursor-pointer"
          style={{
            backgroundColor: estado === 'Activo' ? '#dcfce7' : '#fee2e2',
            color: estado === 'Activo' ? '#166534' : '#991b1b',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      )
    }
  ];

  const handleEstadoChange = async (id: number, nuevoEstado: 'Activo' | 'Inactivo') => {
    try {
      const rol = roles.find((r) => r.id === id);
      if (!rol) return;
      await api.roles.update(id, {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        estado: nuevoEstado,
      });
      toast.success('Estado del rol actualizado');
      await cargarRoles();
    } catch (error: any) {
      toast.error('No se pudo actualizar el estado', { description: error.message });
      await cargarRoles();
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorNombre = validarNombreRol(formData.nombre);
    if (errorNombre) {
      setNombreError(errorNombre);
      toast.warning('Revise el nombre del rol', { description: errorNombre });
      return;
    }
    if (formData.descripcion.trim().length < 10) {
      toast.warning('Descripción demasiado corta', {
        description: 'La descripción del rol debe tener al menos 10 caracteres.',
      });
      return;
    }
    if (formData.gestiones.length === 0) {
      toast.warning('Asigne al menos una gestión', {
        description: 'Cada rol debe tener acceso a al menos una gestión del sistema.',
      });
      return;
    }

    try {
      const permisosExpandidos = expandGestiones(formData.gestiones);
      const created = await api.roles.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        estado: formData.estado,
        permisos: permisosExpandidos,
      });
      if (created?.id && permisosExpandidos.length > 0) {
        await api.roles.updatePermisos(
          Number(created.id),
          permisosExpandidos,
          'Asignación inicial de gestiones'
        );
      }
      toast.success('Rol creado exitosamente', {
        description: `El rol "${formData.nombre.trim()}" se registró correctamente.`,
      });
      setIsCreateModalOpen(false);
      setNombreError('');
      setFormData({ nombre: '', descripcion: '', estado: 'Activo', gestiones: [] });
      await cargarRoles();
    } catch (error: any) {
      toast.error('No se pudo crear el rol', {
        description: error?.message || 'Ocurrió un error inesperado al guardar el rol.',
      });
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const errorNombre = validarNombreRol(formData.nombre, selectedRole.id);
    if (errorNombre) {
      setNombreError(errorNombre);
      toast.warning('Revise el nombre del rol', { description: errorNombre });
      return;
    }
    if (formData.descripcion.trim().length < 10) {
      toast.warning('Descripción demasiado corta', {
        description: 'La descripción del rol debe tener al menos 10 caracteres.',
      });
      return;
    }

    try {
      await api.roles.update(selectedRole.id, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        estado: formData.estado,
      });
      toast.success('Cambios guardados', {
        description: `Los datos del rol "${formData.nombre.trim()}" se actualizaron correctamente.`,
      });
      setIsEditModalOpen(false);
      setSelectedRole(null);
      setNombreError('');
      setFormData({ nombre: '', descripcion: '', estado: 'Activo', gestiones: [] });
      await cargarRoles();
    } catch (error: any) {
      toast.error('No se pudo actualizar el rol', {
        description: error?.message || 'Ocurrió un error inesperado al guardar los cambios.',
      });
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      nombre: role.nombre,
      descripcion: role.descripcion,
      estado: role.estado,
      gestiones: collapseToGestiones(role.permisos),
    });
    setShowEditPermisosNote(true);
    setIsEditModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (role.usuarios > 0) {
      showAlert({
        title: 'No se puede eliminar',
        description: `No se puede eliminar el rol ${role.nombre} porque tiene ${role.usuarios} usuario(s) asignado(s).`,
        type: 'warning',
        confirmText: 'Entendido',
        onConfirm: () => {}
      });
      return;
    }
    showAlert({
      title: '¿Eliminar rol?',
      description: `¿Está seguro de eliminar el rol ${role.nombre}?`,
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        api.roles
          .delete(role.id, 'Eliminación desde panel de roles')
          .then(() => {
            toast.success('Rol eliminado');
            cargarRoles();
          })
          .catch((error: any) => {
            toast.error('No se pudo eliminar el rol', { description: error.message });
          });
      }
    });
  };

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setIsDetailModalOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setSelectedGestiones(collapseToGestiones(role.permisos));
    setIsPermissionsModalOpen(true);
  };

  const renderSelectorGestiones = (
    selected: StaffSubGestionId[],
    onChange: (next: StaffSubGestionId[]) => void
  ) => (
    <>
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-3">
        <span className="text-sm">
          Sub-gestiones seleccionadas: <strong>{selected.length}</strong> de {ALL_SUB_GESTION_IDS.length}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...ALL_SUB_GESTION_IDS])}>
            Todas
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([])}>
            Ninguna
          </Button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-3 border border-border rounded-lg p-3">
        {STAFF_MODULES.map((modulo) => {
          const moduleSelected = isModuleFullySelected(modulo.id, selected);
          return (
            <div key={modulo.id} className="rounded-lg border border-border p-3 bg-background">
              <button
                type="button"
                onClick={() => onChange(toggleModuleInSelection(modulo.id, selected))}
                className={`mb-3 flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                  moduleSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                    moduleSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                >
                  {moduleSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="font-medium text-primary">{modulo.label} (módulo completo)</span>
              </button>
              {modulo.subGestiones.length > 1 ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {modulo.subGestiones.map((sub) => {
                    const isSelected = selected.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onChange(toggleSubGestionInSelection(sub.id, selected))}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={isSelected ? 'text-foreground' : 'text-muted-foreground'}>
                          {sub.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <FieldHelper>
        Puede asignar el módulo completo o solo algunas gestiones dentro del módulo. Cada opción incluye
        consultar, crear, editar y eliminar en esa área.
      </FieldHelper>
    </>
  );

  const handleSavePermissions = async () => {
    if (selectedRole) {
      if (selectedGestiones.length === 0) {
        toast.warning('Seleccione al menos una gestión', {
          description: 'El rol debe tener acceso a al menos una gestión.',
        });
        return;
      }
      try {
        const permisosExpandidos = expandGestiones(selectedGestiones);
        await api.roles.updatePermisos(
          selectedRole.id,
          permisosExpandidos,
          `Actualización de gestiones para rol ${selectedRole.nombre}`
        );
        toast.success('Gestiones actualizadas', {
          description: `El rol "${selectedRole.nombre}" tiene acceso completo a ${selectedGestiones.length} gestión(es).`,
        });
        setIsPermissionsModalOpen(false);
        await cargarRoles();
      } catch (error: any) {
        toast.error('No se pudieron actualizar permisos', { description: error.message });
      }
    }
  };

  // Filtrar roles
  const rolesFiltrados = useMemo(() => (
    roles.filter(rol => {
      const matchBusqueda = busqueda.length === 0 ||
        busqueda.length >= 2 &&
        (rol.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
         rol.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

      const matchRol = filtroRol === 'Todos' || rol.nombre === filtroRol;
      const matchEstado = filtroEstado === 'Todos' || rol.estado === filtroEstado;

      return matchBusqueda && matchRol && matchEstado;
    })
  ), [roles, busqueda, filtroRol, filtroEstado]);

  // Solo mostramos el spinner a pantalla completa en la carga inicial.
  // Si ya hay datos en pantalla, mantenemos la UI montada para que la
  // barra de búsqueda no pierda el foco mientras el usuario escribe.
  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {AlertComponent}
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestión de Roles</h2>
          <p className="text-muted-foreground">Administra los roles y sus permisos en el sistema</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setIsCreateModalOpen(true)}>
          Nuevo Rol
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ..."
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={50}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-3 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary min-w-[160px] text-gray-500"
            >
              <option value="Todos">Filtrar por rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Asesor">Asesor</option>
              <option value="Productor">Productor</option>
              <option value="Repartidor">Repartidor</option>
              <option value="Cliente">Cliente</option>
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px] text-gray-500"
            >
              <option value="Todos">Filtrar por estado</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setBusqueda('');
                setFiltroRol('Todos');
                setFiltroEstado('Todos');
              }}
              className="px-4"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rolesFiltrados}
        actions={[
          commonActions.view(handleView),
          {
            label: 'Gestionar Permisos',
            icon: <Shield className="w-4 h-4" />,
            onClick: handleManagePermissions,
            variant: 'default'
          },
          commonActions.edit(handleEdit),
          commonActions.delete(handleDelete)
        ]}
      />

      {/* Modal de Crear Rol */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNombreError('');
          setFormData({ nombre: '', descripcion: '', estado: 'Activo', gestiones: [] });
        }}
        title="Crear Nuevo Rol"
        size="lg"
      >
        <Form onSubmit={handleCreateRole}>
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre del Rol <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, nombre: value });
                setNombreError(validarNombreRol(value));
              }}
              placeholder="Ej: Supervisor, Contador, etc."
              maxLength={50}
              minLength={3}
              className={`w-full px-4 py-2 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                nombreError
                  ? 'border-destructive ring-1 ring-destructive/20 focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              required
            />
            <div className="mt-1.5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {nombreError ? (
                  <FieldError>{nombreError}</FieldError>
                ) : (
                  <FieldHelper>Debe tener entre 3 y 50 caracteres.</FieldHelper>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">{formData.nombre.length}/50</span>
            </div>
          </div>

          <FormField
            label="Estado"
            name="estado"
            type="select"
            value={formData.estado}
            onChange={(value) => setFormData({ ...formData, estado: value as 'Activo' | 'Inactivo' })}
            options={[
              { value: 'Activo', label: 'Activo' },
              { value: 'Inactivo', label: 'Inactivo' }
            ]}
            required
          />

          <FormField
            label="Descripción"
            name="descripcion"
            type="textarea"
            value={formData.descripcion}
            onChange={(value) => setFormData({ ...formData, descripcion: value as string })}
            placeholder="Describa el rol"
            rows={3}
            required
            minLength={10}
            maxLength={50}
          />

          {/* Gestiones asignables */}
          <div className="space-y-3">
            <label className="block">Gestiones con acceso completo</label>
            {renderSelectorGestiones(formData.gestiones, (gestiones) =>
              setFormData({ ...formData, gestiones })
            )}
          </div>

          <FormActions>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ nombre: '', descripcion: '', estado: 'Activo', gestiones: [] });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Crear Rol
            </Button>
          </FormActions>
        </Form>
      </Modal>

      {/* Modal de Editar Rol */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
          setNombreError('');
          setFormData({ nombre: '', descripcion: '', estado: 'Activo', gestiones: [] });
        }}
        title={`Editar Rol - ${selectedRole?.nombre}`}
        size="md"
      >
        <Form onSubmit={handleUpdateRole}>
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre del Rol <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, nombre: value });
                setNombreError(validarNombreRol(value, selectedRole?.id));
              }}
              placeholder="Ej: Supervisor, Contador, etc."
              maxLength={50}
              minLength={3}
              className={`w-full px-4 py-2 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                nombreError
                  ? 'border-destructive ring-1 ring-destructive/20 focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              required
            />
            <div className="mt-1.5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {nombreError ? (
                  <FieldError>{nombreError}</FieldError>
                ) : (
                  <FieldHelper>Debe tener entre 3 y 50 caracteres.</FieldHelper>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">{formData.nombre.length}/50</span>
            </div>
          </div>

          <FormField
            label="Estado"
            name="estado"
            type="select"
            value={formData.estado}
            onChange={(value) => setFormData({ ...formData, estado: value as 'Activo' | 'Inactivo' })}
            options={[
              { value: 'Activo', label: 'Activo' },
              { value: 'Inactivo', label: 'Inactivo' }
            ]}
            required
          />

          <FormField
            label="Descripción"
            name="descripcion"
            type="textarea"
            value={formData.descripcion}
            onChange={(value) => setFormData({ ...formData, descripcion: value as string })}
            placeholder="Describa el rol"
            rows={3}
            required
            minLength={10}
            maxLength={50}
          />

          {showEditPermisosNote ? (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-blue-700">
                  Para gestionar las gestiones de este rol, usa el botón &quot;Gestionar Permisos&quot; en la tabla principal.
                </p>
                <button
                  type="button"
                  onClick={() => setShowEditPermisosNote(false)}
                  className="rounded-md p-1 text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-900"
                  aria-label="Cerrar nota informativa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <FormActions>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedRole(null);
                setFormData({ nombre: '', descripcion: '', estado: 'Activo', gestiones: [] });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </FormActions>
        </Form>
      </Modal>

      {/* Modal de Detalle */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRole(null);
        }}
        title={`Detalle de Rol - ${selectedRole?.nombre}`}
        size="lg"
      >
        {selectedRole && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Nombre del Rol</p>
                <p>{selectedRole.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  selectedRole.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedRole.estado}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p>{selectedRole.descripcion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Asignados</p>
                <p>{selectedRole.usuarios} usuario{selectedRole.usuarios !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gestiones asignadas</p>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {collapseToGestiones(selectedRole.permisos).length} gestión
                  {collapseToGestiones(selectedRole.permisos).length !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>

            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Gestiones con acceso completo</p>
              {collapseToGestiones(selectedRole.permisos).length > 0 ? (
                <div className="space-y-3">
                  {STAFF_MODULES.map((modulo) => {
                    const asignadas = collapseToGestiones(selectedRole.permisos).filter((id) =>
                      id.startsWith(`${modulo.id}.`)
                    );
                    if (asignadas.length === 0) return null;
                    return (
                      <div key={modulo.id}>
                        <p className="text-sm font-medium text-primary mb-2">{modulo.label}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {asignadas.map((gestionId) => {
                            const label =
                              modulo.subGestiones.find((s) => s.id === gestionId)?.label ?? gestionId;
                            return (
                              <div
                                key={gestionId}
                                className="flex items-center gap-2 p-2 bg-background rounded border"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-sm">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin gestiones asignadas</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedRole(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Gestión de Permisos (por gestión) */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
        }}
        title={`Gestionar Permisos - ${selectedRole?.nombre}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-accent rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selecciona las gestiones a las que tendrá acceso completo el rol{' '}
              <strong>{selectedRole?.nombre}</strong> (consultar, crear, editar y eliminar dentro de cada área).
            </p>
          </div>

          {renderSelectorGestiones(selectedGestiones, setSelectedGestiones)}

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsPermissionsModalOpen(false);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} className="flex-1">
              Guardar gestiones
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}