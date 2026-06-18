# Despliegue en Vercel - Guía de Configuración

## 🎯 Problema Resuelto

Cuando el frontend se desplegaba en Vercel, las peticiones a la API fallaban porque:
- En desarrollo local, Vite redirige `/api` → backend local (proxy)
- En Vercel, no existe ese proxy, las peticiones van a la misma aplicación

**Solución**: El archivo `vercel.json` redirige automáticamente todas las peticiones a `/api` y `/uploads` hacia el backend real en Elastic Beanstalk.

---

## 📋 Pasos para Desplegar

### 1. Asegurar que `vercel.json` está en la carpeta `frontend`

El archivo debe existir en la raíz de la carpeta frontend (junto a `package.json`):

```
frontend/
├── vercel.json          ← AQUÍ
├── vite.config.ts
├── package.json
├── src/
└── ...
```

**Contenido de `vercel.json`**:
- Rewrite de `/api/*` → `https://grandmas-api.us-east-2.elasticbeanstalk.com/api/*`
- Rewrite de `/uploads/*` → `https://grandmas-api.us-east-2.elasticbeanstalk.com/uploads/*`
- SPA routing para todas las demás rutas

### 2. Configurar CORS en el Backend (Elastic Beanstalk)

El backend debe permitir peticiones desde Vercel. Verifica que en Elastic Beanstalk esté configurada la variable de entorno:

```bash
CORS_ORIGINS=https://tu-dominio-vercel.vercel.app
```

O déjalo vacío (por defecto permite todos los orígenes):
```bash
CORS_ORIGINS=
```

**Revisar**: Ve a AWS Elastic Beanstalk → Configuration → Environment Properties y verifica:
- `CORS_ORIGINS` = tu dominio de Vercel
- `NODE_ENV` = `production`

### 3. Conectar Git con Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz login con tu cuenta
3. Click en "New Project"
4. Conecta tu repositorio de GitHub
5. **IMPORTANTE**: En "Root Directory" selecciona `frontend`
6. Click en "Deploy"

### 4. Verificar el Despliegue

Una vez desplegado en Vercel:

```bash
# Prueba que la redirección funciona
curl -X GET https://tu-dominio.vercel.app/api/auth/me \
  -H "Content-Type: application/json"
```

Si ves la respuesta del backend (no un 404 de Vercel), ¡funciona! ✅

---

## 🔍 Troubleshooting

### Error: "Cannot GET /api/..."

**Causa**: El `vercel.json` no está siendo usado. Verifica:
- [ ] `vercel.json` está en la raíz de la carpeta `frontend`
- [ ] El archivo tiene la sintaxis correcta (JSON válido)
- [ ] Hiciste push del archivo a Git
- [ ] Vercel redesplegó después de subir el archivo

**Solución**: 
```bash
git add frontend/vercel.json
git commit -m "feat: add vercel deployment config"
git push
# Vercel redesplegará automáticamente
```

### Error: "CORS error" o "blocked by CORS policy"

**Causa**: El backend no permite la petición desde tu dominio de Vercel.

**Solución**: Actualiza en Elastic Beanstalk:
```
CORS_ORIGINS=https://tu-dominio.vercel.app
```

Y reinicia la aplicación.

### Error: 504 Gateway Timeout

**Causa**: El backend en Elastic Beanstalk está lento o no responde.

**Solución**:
1. Ve a AWS Elastic Beanstalk → Health
2. Verifica el estado de la instancia
3. Si está degradada, click en "Rebuild Environment"
4. Espera 5-10 minutos

---

## 🔗 URLs Importantes

- **Frontend Vercel**: https://tu-dominio.vercel.app
- **Backend API**: https://grandmas-api.us-east-2.elasticbeanstalk.com
- **AWS Console**: https://us-east-2.console.aws.amazon.com/elasticbeanstalk
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 📝 Notas de Desarrollo

### En Local (desarrollo)

```bash
cd frontend
npm run dev
# Vite proxy automáticamente /api → http://localhost:3002
```

### En Vercel (producción)

```bash
# El vercel.json automáticamente redirige
# /api/... → https://grandmas-api.us-east-2.elasticbeanstalk.com/api/...
```

No necesitas cambiar el código del frontend. ¡Las rutas relativas funcionan en ambos lugares!

---

## ✅ Checklist Previo al Deploy

- [ ] `vercel.json` existe en `frontend/`
- [ ] `vercel.json` tiene la URL correcta del backend
- [ ] Backend está desplegado en Elastic Beanstalk
- [ ] CORS_ORIGINS en EB incluye tu dominio Vercel (o está vacío)
- [ ] El repositorio tiene el último código pushed a Git
- [ ] Vercel está conectado al repositorio correcto
- [ ] Root Directory en Vercel está configurado a `frontend`

---

## 🚀 Primera Ejecución

```bash
# Desde la raíz del repositorio
cd frontend
git add vercel.json
git commit -m "docs: add Vercel deployment guide and config"
git push

# Vercel detectará el push y redesplegará automáticamente
# Espera ~2-3 minutos
# Ve a https://vercel.com/dashboard para ver el progreso
```

¡Listo! Tu API ahora funciona desde Vercel. 🎉
