# Despliegue Frontend a S3 + CloudFront

## 📋 Configuración Actual

- **Frontend**: Deployado en S3 + CloudFront
- **API Backend**: `https://grandmas-api.us-east-2.elasticbeanstalk.com` (Elastic Beanstalk)
- **Region AWS**: `us-east-2`
- **CORS Backend**: `CORS_ORIGINS=https://grandmas-liquors-i6tz-imn7fieo0-schezdev.vercel.app/`

---

## 🚀 Pasos de Despliegue

### 1. Preparar el Build Local

```bash
cd frontend

# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Verificar que se creó la carpeta dist/
ls dist/
```

**Resultado esperado**: Carpeta `dist/` con archivos HTML, JS, CSS optimizados.

---

### 2. Crear Bucket S3 (si no existe)

#### Opción A: AWS Console

1. Ve a [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click en **"Create bucket"**
3. **Bucket name**: `grandmas-liquors-frontend`
4. **AWS Region**: `us-east-2`
5. **Block Public Access**: Mantén todas las opciones checkeadas (usaremos CloudFront)
6. Click en **"Create bucket"**

#### Opción B: AWS CLI

```bash
aws s3 mb s3://grandmas-liquors-frontend --region us-east-2

# Bloquear acceso público
aws s3api put-public-access-block \
  --bucket grandmas-liquors-frontend \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

---

### 3. Subir Archivos a S3

#### Opción A: AWS Console

1. Abre el bucket `grandmas-liquors-frontend`
2. Click en **"Upload"**
3. Arrastra la carpeta `frontend/dist/*` (todo el contenido)
4. Click en **"Upload"**

#### Opción B: AWS CLI

```bash
# Desde la carpeta frontend
aws s3 sync dist/ s3://grandmas-liquors-frontend/ \
  --delete \
  --region us-east-2 \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Para index.html: no cachear (siempre obtener la última versión)
aws s3 cp dist/index.html s3://grandmas-liquors-frontend/index.html \
  --region us-east-2 \
  --content-type "text/html" \
  --cache-control "public, max-age=0, must-revalidate"
```

#### Opción C: Script Automatizado

Crea `frontend/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building frontend..."
npm run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://grandmas-liquors-frontend/ \
  --delete \
  --region us-east-2 \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

echo "📝 Uploading index.html..."
aws s3 cp dist/index.html s3://grandmas-liquors-frontend/index.html \
  --region us-east-2 \
  --content-type "text/html" \
  --cache-control "public, max-age=0, must-revalidate"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deploy complete!"
```

Usa: `chmod +x deploy.sh && ./deploy.sh`

---

### 4. Crear/Configurar CloudFront Distribution

#### Paso 1: Crear Distribution

1. Ve a [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click en **"Create distribution"**
3. Click en **"Create"** (en la sección de Web)

#### Paso 2: Configurar Origins

**Origin 1: S3 Frontend**
- **Origin domain**: `grandmas-liquors-frontend.s3.us-east-2.amazonaws.com`
- **Name**: `s3-frontend`
- **S3 access**: Click en "Origin access control settings (recommended)"
- Click en **"Create control setting"** → **"Create"**
- **Origin protocol policy**: HTTPS only
- Click **"Add origin"**

**Origin 2: Elastic Beanstalk API**
- **Origin domain**: `grandmas-api.us-east-2.elasticbeanstalk.com`
- **Name**: `elastic-beanstalk-api`
- **Protocol**: HTTPS
- **Origin protocol policy**: HTTPS only
- **Origin SSL protocols**: TLSv1.2
- Click **"Add origin"**

#### Paso 3: Configurar Default Behavior

- **Origin**: `s3-frontend`
- **Viewer protocol policy**: Redirect HTTP to HTTPS
- **Allowed HTTP methods**: GET, HEAD, OPTIONS
- **Cache policy**: Managed-CachingDisabled
- **Compress objects automatically**: ✅ Checked
- Click **"Create distribution"**

#### Paso 4: Agregar Behaviors Adicionales

Una vez creada la distribution, ve a **Behaviors** y crea:

**Behavior 1: API Requests**
- **Path pattern**: `/api/*`
- **Origin**: `elastic-beanstalk-api`
- **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- **Cache policy**: Managed-CachingDisabled
- **Origin request policy**: Managed-AllViewerExceptHostHeader
- **Compress**: ✅ Checked
- Click **"Create behavior"**

**Behavior 2: File Uploads**
- **Path pattern**: `/uploads/*`
- **Origin**: `elastic-beanstalk-api`
- **Allowed HTTP methods**: GET, HEAD
- **Cache policy**: Managed-CachingOptimized
- Click **"Create behavior"**

**Behavior 3: Static Assets (JS/CSS)**
- **Path pattern**: `*.js`
- **Origin**: `s3-frontend`
- **Cache policy**: Managed-CachingOptimized
- Click **"Create behavior"**

Repite para: `*.css`, `*.woff*`, imágenes, etc.

#### Paso 5: Configurar Error Responses

1. Ve a **Error pages**
2. Crea error responses para `403` y `404`:
   - **Error code**: 403
   - **Response page path**: `/index.html`
   - **HTTP Response code**: 200
   - **Error caching min TTL**: 0

3. Repite para `404`

#### Paso 6: Obtener OAC Policy

1. Ve a **Origins**
2. Selecciona el origen `s3-frontend`
3. Click en **"Copy policy"**
4. Ve a [S3 Console](https://s3.console.aws.amazon.com/) → Tu bucket → **Permissions**
5. Ve a **Bucket policy** → **Edit**
6. Pega la política
7. Click en **"Save changes"**

---

### 5. Actualizar CORS en Backend (Elastic Beanstalk)

La URL de CloudFront es la que debes agregar a `CORS_ORIGINS`:

```bash
# Obtener dominio de CloudFront
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions --query \
  'DistributionList.Items[?Origins.Items[?DomainName==`grandmas-liquors-frontend.s3.us-east-2.amazonaws.com`]].DomainName' \
  --output text)

echo $CLOUDFRONT_DOMAIN
# Resultado: d1a2b3c4d5e6f7.cloudfront.net
```

Luego ve a **AWS Elastic Beanstalk**:
1. Selecciona tu aplicación
2. Ve a **Configuration** → **Environment properties**
3. Busca `CORS_ORIGINS`
4. Actualiza a: `https://d1a2b3c4d5e6f7.cloudfront.net` (tu dominio CloudFront real)
5. Click en **Apply**

---

### 6. Verificar Despliegue

```bash
# Obtener URL de CloudFront
CLOUDFRONT_URL=$(aws cloudfront list-distributions --query \
  'DistributionList.Items[?Origins.Items[?DomainName==`grandmas-liquors-frontend.s3.us-east-2.amazonaws.com`]].DomainName' \
  --output text | head -1)

echo "🌐 Frontend URL: https://$CLOUDFRONT_URL"

# Verificar que el frontend carga
curl -I https://$CLOUDFRONT_URL

# Verificar que la API es accesible
curl -X GET https://$CLOUDFRONT_URL/api/auth/me \
  -H "Content-Type: application/json"
```

---

## 🔧 Troubleshooting

### ❌ "Access Denied" al acceder a S3

**Problema**: CloudFront no puede acceder al bucket S3.

**Solución**:
1. Ve a **CloudFront** → Tu distribution → **Origins** → `s3-frontend`
2. Copia la política de OAC
3. Ve a **S3** → Tu bucket → **Permissions** → **Bucket policy**
4. Pega la política y guarda

### ❌ "CORS error" en la consola del navegador

**Problema**: El backend no permite peticiones desde CloudFront.

**Solución**:
```bash
# Obtener dominio de CloudFront
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions --query \
  'DistributionList.Items[?Origins.Items[?DomainName==`grandmas-liquors-frontend.s3.us-east-2.amazonaws.com`]].DomainName' \
  --output text | head -1)

# Actualizar CORS_ORIGINS en EB
# Ir a AWS EB → Configuration → Environment properties
# CORS_ORIGINS=https://$CLOUDFRONT_DOMAIN
```

### ❌ "404 Not Found" para `/api/*`

**Problema**: CloudFront no tiene configurado el behavior para `/api/*`.

**Solución**:
1. Ve a **CloudFront** → Tu distribution → **Behaviors**
2. Verifica que existe un behavior para `/api/*`
3. El origin debe ser `elastic-beanstalk-api`

### ❌ Index.html se cachea demasiado tiempo

**Problema**: Usuario ve versión antigua después de actualizar.

**Solución**: Asegurate de que `index.html` tiene `max-age=0`:
```bash
aws s3 cp dist/index.html s3://grandmas-liquors-frontend/index.html \
  --region us-east-2 \
  --content-type "text/html" \
  --cache-control "public, max-age=0, must-revalidate"
```

---

## 📊 Checklist de Despliegue

- [ ] Build local funciona: `npm run build`
- [ ] Carpeta `dist/` se creó correctamente
- [ ] Bucket S3 existe: `grandmas-liquors-frontend`
- [ ] S3 bucket está bloqueado (no público)
- [ ] Archivos subidos a S3 correctamente
- [ ] CloudFront distribution creada
- [ ] Origins configurados (S3 + EB)
- [ ] Behaviors configurados (`/api/*`, `/uploads/*`, etc.)
- [ ] OAC policy aplicada a bucket S3
- [ ] Error pages configuradas (403, 404 → index.html)
- [ ] CORS_ORIGINS en EB incluye dominio CloudFront
- [ ] Test: Frontend carga en https://dominio.cloudfront.net
- [ ] Test: Peticiones a /api/* funcionan

---

## 🔄 Actualizaciones Futuras

Cada vez que actualices el frontend:

```bash
cd frontend
npm run build
./deploy.sh  # O ejecuta los comandos de sync manual

# Espera 1-2 minutos para que CloudFront propague los cambios
```

Si necesitas invalidar el cache inmediatamente:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 🔗 URLs Importantes

- **S3 Bucket Console**: https://s3.console.aws.amazon.com/s3/
- **CloudFront Console**: https://console.aws.amazon.com/cloudfront/
- **Elastic Beanstalk Console**: https://console.aws.amazon.com/elasticbeanstalk/
- **Frontend URL**: `https://tu-dominio.cloudfront.net`
- **Backend API**: `https://grandmas-api.us-east-2.elasticbeanstalk.com`

---

## 📝 Notas Importantes

1. **HTTPS Obligatorio**: Todos los orígenes deben usar HTTPS
2. **Cache Invalidation**: Los cambios pueden tardar 1-2 minutos en propagarse
3. **index.html**: NUNCA cachear por más de 1 hora (usar `max-age=0`)
4. **Static Assets**: Cachear por largo tiempo (1 año) usando hashes en nombres
5. **CORS**: Debe coincidir exactamente con el origen (sin trailing slash)

---

## 🚀 Próximos Pasos

1. Crear dominio personalizado (ej: `grandmas-liquors.com`)
2. Configurar SSL certificate en CloudFront
3. Agregar WAF (Web Application Firewall)
4. Configurar monitoreo y alertas
5. Implementar CI/CD para deploys automáticos
