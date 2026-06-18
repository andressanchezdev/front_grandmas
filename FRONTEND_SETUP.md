# Frontend - Guía Rápida de Configuración

## ✅ Configuración Realizada

### 1. **Configuración de Variables de Ambiente**

El frontend ahora soporta múltiples ambientes:

```
.env                    # Desarrollo local (proxy Vite)
.env.production        # Producción S3 + CloudFront
.env.example           # Template
```

### 2. **Configuración de API**

**Archivo**: `vite.config.ts`

```typescript
// Producción (S3/CloudFront)
const DEFAULT_API_PROXY_TARGET = 'https://grandmas-api.us-east-2.elasticbeanstalk.com'
const DEFAULT_API_BASE_URL = 'https://grandmas-api.us-east-2.elasticbeanstalk.com'
```

**Variables de Entorno**:
- `VITE_API_PROXY_TARGET`: URL del backend (para proxy en desarrollo)
- `VITE_API_BASE_URL`: URL base de la API (para producción)

**En el código** (`src/app/services/http.ts`):
- Función `resolveApiPath()` maneja automáticamente URLs relativas o absolutas
- En desarrollo: usa rutas relativas `/api/*` (proxy de Vite)
- En producción: usa URL completa desde `VITE_API_BASE_URL`

### 3. **Build & Deploy**

```bash
# Desarrollo local
npm run dev              # Proxy automático a https://grandmas-api.us-east-2.elasticbeanstalk.com

# Producción
npm run build            # Crea carpeta dist/ optimizada
./deploy.sh              # Sube a S3 + invalida CloudFront (Linux/Mac)
.\deploy.ps1             # Sube a S3 + invalida CloudFront (Windows)
```

### 4. **Configuración de CloudFront**

**Archivo**: `cloudfront-config.json`

Contiene especificación de:
- ✅ Origins (S3 + Elastic Beanstalk)
- ✅ Behaviors (rutas `/api/*`, `/uploads/*`, static assets)
- ✅ Cache policies (corta para API, larga para assets)
- ✅ Error pages (404 → index.html para SPA)
- ✅ Compression (gzip para JS, CSS, etc.)

---

## 🚀 Pasos Inmediatos

### 1. **Validar Build Local**

```bash
cd frontend
npm install
npm run build
ls dist/
```

Debe crear carpeta `dist/` con:
```
dist/
├── index.html
├── assets/
│   ├── main.js
│   ├── main.css
│   └── [otros archivos]
└── favicon/
```

### 2. **Crear/Verificar S3 Bucket**

```bash
# Crear bucket
aws s3 mb s3://grandmas-liquors-frontend --region us-east-2

# Bloquear acceso público (importante)
aws s3api put-public-access-block \
  --bucket grandmas-liquors-frontend \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 3. **Crear CloudFront Distribution**

Ve a: https://console.aws.amazon.com/cloudfront/

Sigue la guía en `S3_CLOUDFRONT_DEPLOYMENT.md` (Paso 4)

**Información que necesitarás**:
- Distribution ID (para el script de deploy)
- Domain Name (para CORS en backend)

### 4. **Actualizar CORS en Backend**

Una vez tengas el dominio de CloudFront (ej: `d1a2b3c4d5e6f7.cloudfront.net`):

```bash
# AWS EB Configuration → Environment Properties
CORS_ORIGINS=https://d1a2b3c4d5e6f7.cloudfront.net
```

### 5. **Deploy Inicial**

**Linux/Mac**:
```bash
chmod +x deploy.sh
./deploy.sh YOUR_DISTRIBUTION_ID
```

**Windows (PowerShell)**:
```powershell
.\deploy.ps1 -DistributionId "YOUR_DISTRIBUTION_ID"
```

**Manual con AWS CLI**:
```bash
# Subir todo excepto index.html
aws s3 sync dist/ s3://grandmas-liquors-frontend/ \
  --delete --region us-east-2 \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Subir index.html sin caché
aws s3 cp dist/index.html s3://grandmas-liquors-frontend/index.html \
  --region us-east-2 \
  --content-type "text/html" \
  --cache-control "public, max-age=0, must-revalidate"

# Invalidar caché de CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 📊 Estructura de Archivos

```
frontend/
├── vite.config.ts                    ✅ Configuración con HTTPS + env
├── .env                              ✅ Desarrollo
├── .env.production                   ✅ Producción (S3/CloudFront)
├── .env.example                      ✅ Template
├── cloudfront-config.json            ✅ Especificación CloudFront
├── deploy.sh                         ✅ Script deploy (Linux/Mac)
├── deploy.ps1                        ✅ Script deploy (Windows)
├── S3_CLOUDFRONT_DEPLOYMENT.md       ✅ Guía completa
├── VERCEL_DEPLOYMENT.md              ⚠️  Antiguo (para Vercel)
├── vercel.json                       ⚠️  Antiguo (para Vercel)
├── src/
│   └── app/
│       └── services/
│           ├── http.ts               ✅ Resolver URLs API
│           ├── api/
│           │   ├── index.ts
│           │   ├── auth.api.ts
│           │   ├── admin.api.ts
│           │   └── ...
│           └── ...
└── ...
```

---

## 🔍 Verificar Configuración

### Local (Desarrollo)

```bash
cd frontend
npm run dev

# En la consola del navegador:
fetch('/api/auth/me').then(r => r.json()).then(console.log)
# Debe conectar a: https://grandmas-api.us-east-2.elasticbeanstalk.com/api/auth/me
```

### Producción (S3/CloudFront)

```bash
CLOUDFRONT_URL="d1a2b3c4d5e6f7.cloudfront.net"

# Verificar que el frontend carga
curl https://$CLOUDFRONT_URL/

# Verificar que la API es accesible
curl https://$CLOUDFRONT_URL/api/auth/me \
  -H "Content-Type: application/json"
```

---

## ❓ FAQ

### P: ¿Necesito actualizar CORS cuando cambio a CloudFront?
**R**: Sí. CORS_ORIGINS en el backend debe tener el dominio de CloudFront (sin trailing slash).

### P: ¿Cuánto tarda en propagarse después del deploy?
**R**: 1-2 minutos para CloudFront, 5-10 minutos para caché en navegadores.

### P: ¿Cómo invalido el caché antes de 1-2 minutos?
**R**: Usa `aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"`

### P: ¿Puedo usar un dominio personalizado?
**R**: Sí, ve a CloudFront → Alternate domain names → Agrega tu dominio + configura SSL.

### P: ¿Por qué index.html no se cachea?
**R**: Para que los cambios se vean inmediatamente. Vite agrega hashes a JS/CSS, así que pueden cachearse.

---

## 📚 Recursos

- **Documentación Completa**: [S3_CLOUDFRONT_DEPLOYMENT.md](S3_CLOUDFRONT_DEPLOYMENT.md)
- **Vite Config**: [vite.config.ts](vite.config.ts)
- **CloudFront Config**: [cloudfront-config.json](cloudfront-config.json)
- **AWS S3**: https://s3.console.aws.amazon.com/
- **AWS CloudFront**: https://console.aws.amazon.com/cloudfront/
- **AWS EB**: https://console.aws.amazon.com/elasticbeanstalk/

---

## ✅ Checklist

Antes de desplegar:

- [ ] `npm run build` funciona sin errores
- [ ] Carpeta `dist/` se creó correctamente
- [ ] S3 bucket existe: `grandmas-liquors-frontend`
- [ ] CloudFront distribution está creada
- [ ] CORS_ORIGINS en backend tiene dominio CloudFront
- [ ] AWS CLI está configurado y autenticado
- [ ] Distribution ID del CloudFront disponible
- [ ] Scripts tienen permisos de ejecución (en Linux: `chmod +x deploy.sh`)

Después de desplegar:

- [ ] Frontend carga en `https://dominio.cloudfront.net`
- [ ] Peticiones `/api/*` funcionan
- [ ] No hay errores CORS en la consola
- [ ] Imágenes y assets cargan correctamente
- [ ] Redirect HTTP → HTTPS funciona

---

¡Configuración completada! 🎉
