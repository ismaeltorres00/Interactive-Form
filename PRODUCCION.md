# Checklist de producción — MarkeFlow

## 1. Servicios externos necesarios

| Servicio | Uso | Plan mínimo |
|---|---|---|
| **Supabase** (o PostgreSQL managed) | Base de datos | Free tier suficiente para empezar |
| **Anthropic** | Claude API (IA) | Pay-per-use (~$3/M tokens en Sonnet) |
| **Google Cloud** | OAuth + Drive API | Gratuito |
| **Vercel** / Railway / Fly.io | Hosting Next.js | Free tier o ~$5/mes |

---

## 2. Variables de entorno en producción

Configurar en el panel del hosting (Vercel → Settings → Environment Variables, etc.).

```env
# ── Base de datos ─────────────────────────────────────────
DATABASE_URL=postgresql://usuario:password@host:5432/dbname

# ── IA ────────────────────────────────────────────────────
AI_PROVIDER=claude          # IMPORTANTE: cambiar de 'mock' a 'claude'
ANTHROPIC_API_KEY=sk-ant-... # Clave real de https://console.anthropic.com

# ── Google Drive ──────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://TUDOMINIO.com/api/auth/google/callback

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://TUDOMINIO.com
```

> ⚠️ `AI_PROVIDER=mock` está activo en `.env.local` para desarrollo.
> En producción **debe ser `claude`**, de lo contrario la IA devuelve textos falsos.

---

## 3. Base de datos — migraciones

Ejecutar **en orden** todos los archivos de `supabase/migrations/` en la base de datos de producción:

```
001_initial.sql
002_add_tool_types.sql
003_answers_is_active.sql
004_sessions_soft_delete.sql
005_sessions_company_name.sql
006_add_eje_xy_type.sql
007_add_pending_ai_review_status.sql
008_settings_table.sql
```

Si usas Supabase managed, puedes ejecutarlos desde el **SQL Editor** de su dashboard o con la CLI:

```bash
supabase db push
```

Si usas PostgreSQL directo (Railway, Neon, etc.):

```bash
psql $DATABASE_URL -f supabase/migrations/001_initial.sql
psql $DATABASE_URL -f supabase/migrations/002_add_tool_types.sql
# ... y así para cada fichero
```

---

## 4. Google Cloud — configuración paso a paso

### 4.1 Crear el proyecto y activar la API

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo (ej. "MarkeFlow")
3. Ir a **APIs y servicios → Biblioteca**
4. Buscar **Google Drive API** y activarla

### 4.2 Configurar la pantalla de consentimiento OAuth

1. Ir a **APIs y servicios → Pantalla de consentimiento OAuth**
2. Tipo de usuario: **Externo** (aunque solo lo use el diseñador)
3. Rellenar nombre de la app, email de soporte
4. Scopes: añadir `https://www.googleapis.com/auth/drive.file`
5. En **Usuarios de prueba**: añadir el email del diseñador mientras la app está en modo prueba
6. Para pasar a producción sin verificación de Google: la app solo necesita el scope `drive.file` (no sensible), pero si Google pide verificación, el proceso tarda 1-4 semanas

### 4.3 Crear credenciales OAuth 2.0

1. Ir a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
2. Tipo: **Aplicación web**
3. Orígenes JS autorizados: `https://TUDOMINIO.com`
4. URIs de redirección autorizadas:
   - Desarrollo: `http://localhost:3000/api/auth/google/callback`
   - Producción: `https://TUDOMINIO.com/api/auth/google/callback`
5. Copiar el **Client ID** y **Client Secret** a las variables de entorno

### 4.4 Primera conexión en producción

Tras desplegar, el diseñador debe ir a cualquier sesión → **Acciones → Conectar Google Drive** y autorizar una vez. Los tokens se guardan en la tabla `settings` de la BD.

---

## 5. Hosting — opción recomendada: Vercel

### Deploy inicial

```bash
npm install -g vercel
vercel --prod
```

O conectar el repositorio de GitHub en [vercel.com](https://vercel.com) y activar el auto-deploy.

### Configuración importante en Vercel

- **Framework**: Next.js (detectado automáticamente)
- **Build command**: `next build` (por defecto)
- **Root directory**: `/` (raíz del proyecto)
- Añadir todas las variables de entorno del punto 2

### Alternativa: Railway

Railway permite desplegar Next.js + PostgreSQL en el mismo proyecto, más sencillo si se quiere todo junto:

1. Crear proyecto en [railway.app](https://railway.app)
2. Añadir servicio PostgreSQL → Railway da la `DATABASE_URL` automáticamente
3. Añadir servicio desde GitHub (el repo de Next.js)
4. Configurar variables de entorno

---

## 6. Consideraciones de seguridad

### Lo que está bien para un uso de un solo diseñador
- El acceso de clientes al formulario es por UUID en URL (suficiente para este caso de uso)
- Las API routes de IA (`/api/ai-complete`, `/api/ai-inline`) no tienen autenticación — están en el servidor y los clientes no las llaman directamente
- Los tokens de Google Drive se guardan cifrados en la BD (la tabla `settings`)

### Lo que hay que revisar si escala

| Riesgo | Situación actual | Solución si escala |
|---|---|---|
| Formulario sin login | Cualquiera con el UUID puede ver el formulario | Añadir token de acceso de un solo uso o expiración |
| Un solo par de tokens Drive | Solo soporta un diseñador | Asociar tokens a `designer_id` en tabla `settings` |
| RLS permisivas (`FOR ALL USING (true)`) | Cualquiera puede leer sesiones vía API | Añadir autenticación de diseñador en las rutas del backoffice |
| `/api/ai-complete` sin auth | Riesgo de abuso si la URL se conoce | Añadir verificación de `sessionId` existente en BD |

### Variables sensibles
Nunca commitear al repositorio:
- `.env.local`
- `google_tokens` (se guarda en BD, no en archivos)
- Cualquier fichero con `sk-ant-` o `GOCSPX-`

Verificar que `.gitignore` incluye `.env*` y `.env.local`.

---

## 7. Funcionalidades que NO funcionan en producción sin cambios

| Funcionalidad | Estado | Motivo |
|---|---|---|
| `AI_PROVIDER=ollama` | ❌ No funciona | Ollama corre en local, no en servidor |
| `AI_PROVIDER=mock` | ✅ Funciona pero devuelve texto falso | Solo para desarrollo |
| Export PDF (print) | ✅ Funciona | Es vía browser, sin dependencias de servidor |
| Export Word | ✅ Funciona | Generado en servidor con `docx` |
| Google Drive | ✅ Funciona si está configurado | Requiere credenciales del punto 4 |

---

## 8. Checklist final antes de lanzar

- [ ] Todas las migraciones ejecutadas en BD de producción
- [ ] `AI_PROVIDER=claude` en variables de producción
- [ ] `ANTHROPIC_API_KEY` real configurada
- [ ] `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` configuradas
- [ ] `GOOGLE_REDIRECT_URI` apunta al dominio de producción
- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio de producción
- [ ] Primera conexión con Google Drive hecha desde el backoffice de producción
- [ ] Probar formulario de cliente con una sesión de prueba
- [ ] Probar exportación Word y subida a Drive
- [ ] Verificar que `.env.local` NO está en el repositorio

---

## 9. Datos de seed / configuración inicial

Tras las migraciones, la BD ya tiene los bloques y preguntas del seed (`001_initial.sql`). Si se quiere añadir la pregunta de IA de "Manifiesto de marca" (creada manualmente en desarrollo), ejecutar:

```sql
INSERT INTO questions (block_id, "order", label, type, ai_prompt, required, is_active)
VALUES (
  '11111111-0000-0000-0000-000000000002',
  2,
  'Manifiesto de marca',
  'ai_assisted',
  'Basándote en las creencias y valores que ha descrito el cliente, redacta un manifiesto de marca breve y poderoso (3-5 frases). Debe capturar la esencia de quiénes son y en qué creen. Usa un tono directo, auténtico y memorable.',
  false,
  true
);
```

> Esta pregunta se creó directamente en la BD de desarrollo y **no está en las migraciones**. Añadir esta inserción a una nueva migración `009_seed_ai_questions.sql` antes del deploy o ejecutarla manualmente.
