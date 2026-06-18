import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { filtrarProductos, mapCatalogProduct, normalizeCategorias } from './landingShared';

export function useProducts() {
  const [productosAPI, setProductosAPI] = useState<any[]>([]);
  const [categoriasAPI, setCategoriasAPI] = useState<any[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { productos, categorias } = await api.public.getCatalogo();
        setProductosAPI(Array.isArray(productos) ? productos : []);
        setCategoriasAPI(Array.isArray(categorias) ? categorias : []);
      } catch (error) {
        console.error('Error cargando catálogo público:', error);
      } finally {
        setLoadingProductos(false);
      }
    };

    void cargarDatos();
  }, []);

  const productos = useMemo(
    () =>
      productosAPI.map((producto) =>
        mapCatalogProduct(producto as Parameters<typeof mapCatalogProduct>[0])
      ),
    [productosAPI]
  );

  const categorias = useMemo(
    () => normalizeCategorias(categoriasAPI as Array<{ nombre?: string }>),
    [categoriasAPI]
  );

  const productosFiltrados = useMemo(
    () => filtrarProductos(productos, busqueda, categoriaSeleccionada),
    [productos, busqueda, categoriaSeleccionada]
  );

  return {
    loadingProductos,
    productos,
    categorias,
    productosFiltrados,
    busqueda,
    setBusqueda,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  };
}
