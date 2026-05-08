# Contexto del proyecto — Formulario inteligente para diseñador

## Resumen del producto

Aplicación web para un diseñador gráfico/branding que actualmente usa un PowerPoint para recopilar información de sus clientes. El objetivo es digitalizar ese proceso en un formulario web atractivo, inteligente y sin pérdida de datos.

El diseñador envía un enlace único al cliente. El cliente rellena el formulario por bloques, puede pausar y continuar cuando quiera. Algunas preguntas se completan automáticamente con IA (Claude) sin que el cliente lo vea. Al finalizar, se genera un resumen exportable en PDF y Word que se sube a Google Drive del diseñador.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Base de datos | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| IA | Claude API — modelo `claude-sonnet-4-20250514` |
| Exportación | Librería `docx` (Word) + `@react-pdf/renderer` (PDF) |
| Google Drive | Google Drive API v3 con OAuth2 |
| Despliegue local | Supabase vía Docker + Next.js en local (`npm run dev`) |
| SO de desarrollo | Windows |

---

## Entorno local — Docker

El único servicio en Docker es **Supabase**. Next.js corre directamente en local.

### `docker-compose.yml` (en la raíz del proyecto)

```yaml
version: '3.8'

services:
  supabase-db:
    image: supabase/postgres:15.1.0.147
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d

  supabase-studio:
    image: supabase/studio:20240101-8e4a94c
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      SUPABASE_URL: http://kong:8000
      STUDIO_PG_META_URL: http://pg-meta:8080

  kong:
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml

  pg-meta:
    image: supabase/postgres-meta:v0.68.0
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: supabase-db
      PG_META_DB_PASSWORD: postgres

  supabase-auth:
    image: supabase/gotrue:v2.132.3
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres@supabase-db:5432/postgres?search_path=auth
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_JWT_SECRET: super-secret-jwt-token-local-only
      GOTRUE_DISABLE_SIGNUP: false
    ports:
      - "9999:9999"

volumes:
  supabase-db-data:
```

### Arrancar el entorno
```bash
docker compose up -d
```

### Variables de entorno — `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-local>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-local>
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## Estructura del proyecto Next.js

```
/
├── app/
│   ├── (public)/
│   │   └── form/
│   │       └── [sessionId]/
│   │           └── page.tsx          ← Formulario del cliente
│   ├── (admin)/
│   │   ├── layout.tsx                ← Protegido con Supabase Auth
│   │   └── dashboard/
│   │       ├── page.tsx              ← Lista de clientes
│   │       └── [sessionId]/
│   │           └── page.tsx          ← Detalle y edición
│   └── api/
│       ├── ai-complete/
│       │   └── route.ts              ← Llamada a Claude (invisible al cliente)
│       ├── export/
│       │   └── route.ts              ← Genera PDF + Word y sube a Drive
│       └── auth/
│           └── google/
│               └── callback/
│                   └── route.ts      ← OAuth callback Google Drive
├── components/
│   ├── form/
│   │   ├── FormWizard.tsx            ← Contenedor principal del wizard
│   │   ├── BlockProgress.tsx         ← Barra de progreso por bloques
│   │   ├── QuestionRenderer.tsx      ← Renderiza cada tipo de pregunta
│   │   └── AiLoader.tsx              ← Loader visible mientras Claude responde
│   └── dashboard/
│       ├── ClientTable.tsx
│       └── SessionEditor.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Cliente browser
│   │   └── server.ts                 ← Cliente server (Server Components)
│   ├── claude.ts                     ← Wrapper Anthropic SDK
│   ├── export/
│   │   ├── generateWord.ts           ← Genera .docx con librería docx
│   │   └── generatePdf.ts            ← Genera PDF
│   └── drive.ts                      ← Google Drive API v3
├── supabase/
│   └── migrations/
│       └── 001_initial.sql           ← Schema completo
├── docker-compose.yml
└── .env.local
```

---

## Schema de base de datos

### Lógica de diseño

- **`blocks`** y **`questions`** definen la plantilla base (gestionada por el diseñador desde el dashboard).
- Cada cliente tiene una **`session`** con un `id` único que va en la URL.
- Cada respuesta se guarda en **`answers`** inmediatamente al completar cada pregunta (guardado progresivo).
- El progreso se calcula automáticamente: `(preguntas respondidas / total preguntas activas) * 100`.
- Las preguntas con `type = 'ai_assisted'` tienen un `ai_prompt` que Claude usa para completar la respuesta. El cliente solo ve el resultado, nunca el prompt.

### `supabase/migrations/001_initial.sql`

```sql
-- BLOQUES (plantilla fija, gestionable desde dashboard)
CREATE TABLE blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order"     int NOT NULL,
  title       text NOT NULL,
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- PREGUNTAS
CREATE TABLE questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    uuid REFERENCES blocks(id) ON DELETE CASCADE,
  "order"     int NOT NULL,
  label       text NOT NULL,
  helper_text text,
  type        text NOT NULL CHECK (type IN (
                'text', 'textarea', 'select', 'multiselect',
                'boolean', 'ai_assisted'
              )),
  options     jsonb,      -- Solo para type = 'select' | 'multiselect'
  ai_prompt   text,       -- Solo para type = 'ai_assisted'
  required    boolean DEFAULT true,
  is_active   boolean DEFAULT true
);

-- SESIONES DE CLIENTE
CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name     text NOT NULL,
  client_email    text,
  designer_id     uuid REFERENCES auth.users(id),
  status          text DEFAULT 'pending' CHECK (status IN (
                    'pending', 'in_progress', 'completed'
                  )),
  current_block   int DEFAULT 0,
  progress        int DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  drive_folder_id text,   -- ID de la carpeta en Google Drive una vez creada
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RESPUESTAS (una fila por pregunta respondida)
CREATE TABLE answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid REFERENCES sessions(id) ON DELETE CASCADE,
  question_id  uuid REFERENCES questions(id) ON DELETE CASCADE,
  value        text,       -- Respuesta del cliente o generada por IA
  ai_generated boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (session_id, question_id)
);

-- Trigger para actualizar updated_at en sessions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vista de progreso por bloque (útil para la barra visual)
CREATE VIEW session_block_progress AS
SELECT
  s.id AS session_id,
  b.id AS block_id,
  b.title AS block_title,
  b."order" AS block_order,
  COUNT(q.id) AS total_questions,
  COUNT(a.id) AS answered_questions,
  ROUND((COUNT(a.id)::decimal / NULLIF(COUNT(q.id), 0)) * 100) AS block_progress
FROM sessions s
CROSS JOIN blocks b
JOIN questions q ON q.block_id = b.id AND q.is_active = true
LEFT JOIN answers a ON a.session_id = s.id AND a.question_id = q.id
WHERE b.is_active = true
GROUP BY s.id, b.id, b.title, b."order"
ORDER BY b."order";

-- RLS (Row Level Security)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- El cliente puede leer/escribir solo su propia sesión (acceso por sessionId en URL, sin login)
CREATE POLICY "client_session_access" ON sessions
  FOR ALL USING (true);  -- Ajustar si se quiere más restricción

CREATE POLICY "client_answers_access" ON answers
  FOR ALL USING (true);

-- El diseñador ve todo (autenticado)
CREATE POLICY "designer_full_access_sessions" ON sessions
  FOR ALL TO authenticated USING (true);

CREATE POLICY "designer_full_access_answers" ON answers
  FOR ALL TO authenticated USING (true);
```

---

## Flujo de la aplicación

### 1. Diseñador crea cliente (Dashboard)
- Introduce nombre y email del cliente.
- Se crea una fila en `sessions` con `status = 'pending'`.
- Se genera y copia la URL: `https://dominio.com/form/{sessionId}`.
- Opcionalmente se envía por email (fase 2).

### 2. Cliente rellena el formulario
- Accede a `/form/{sessionId}`.
- Ve los bloques como pasos numerados con barra de progreso general y progreso por bloque.
- Cada respuesta se guarda en `answers` inmediatamente (upsert por `session_id + question_id`).
- Al llegar a una pregunta `ai_assisted`, el frontend llama a `/api/ai-complete` con el contexto de respuestas anteriores. El cliente ve un loader. La respuesta de Claude se guarda con `ai_generated = true`.
- Si el cliente cierra el navegador, al volver a la misma URL retoma exactamente donde estaba (se lee `current_block` y las `answers` existentes).
- Al completar el último bloque, `status` cambia a `completed`.

### 3. Diseñador revisa y exporta (Dashboard)
- Ve todos los clientes con su progreso.
- Puede editar cualquier respuesta (también las generadas por IA).
- Exporta: se llama a `/api/export` que genera Word + PDF y los sube a Google Drive en una carpeta por cliente.

---

## Tipos de pregunta

| Tipo | Descripción |
|---|---|
| `text` | Input de texto corto |
| `textarea` | Texto largo |
| `select` | Desplegable, una opción |
| `multiselect` | Checkboxes, varias opciones |
| `boolean` | Sí / No |
| `ai_assisted` | El cliente no la ve; Claude la completa con el contexto de las respuestas anteriores |

---

## Integración con Claude API

### Endpoint: `POST /api/ai-complete`

**Request body:**
```json
{
  "sessionId": "uuid",
  "questionId": "uuid"
}
```

**Lógica interna:**
1. Lee la pregunta y su `ai_prompt` de la BD.
2. Lee todas las respuestas anteriores de esa sesión como contexto.
3. Llama a Claude con el prompt del diseñador + contexto.
4. Guarda la respuesta en `answers` con `ai_generated = true`.
5. Devuelve la respuesta al frontend.

**Llamada a Claude:**
```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: 'Eres un asistente especializado en branding y diseño. Responde de forma concisa y profesional.',
  messages: [{
    role: 'user',
    content: `${question.ai_prompt}\n\nContexto del cliente:\n${contextString}`
  }]
})
```

---

## Barra de progreso — lógica visual

```
[Bloque 1 ████████████] 100%   ✓
[Bloque 2 ████████░░░░]  67%   En progreso
[Bloque 3 ░░░░░░░░░░░░]   0%   Pendiente
[Bloque 4 ░░░░░░░░░░░░]   0%   Pendiente

Progreso total: 42%
```

- La barra usa la vista `session_block_progress` de Supabase.
- Se actualiza en tiempo real con Supabase Realtime o simplemente refetch tras cada respuesta.
- El diseñador en el dashboard ve el mismo componente.

---

## Exportación

### Word (`.docx`)
- Usar la librería npm `docx`.
- Estructura: portada con nombre del cliente + fecha, un apartado por bloque, cada pregunta con su respuesta. Las respuestas generadas por IA se marcan con una nota discreta.

### PDF
- Usar `@react-pdf/renderer` o generar el Word y convertirlo.
- Alternativa más simple: renderizar una página Next.js en `/export/{sessionId}` optimizada para impresión y usar Puppeteer en el servidor para capturarla como PDF.

### Google Drive
- OAuth2 del diseñador configurado una vez en el dashboard.
- Al exportar: crear carpeta `/{NombreCliente}_{fecha}` en Drive, subir ambos ficheros.
- Guardar el `drive_folder_id` en `sessions` para acceso directo futuro.

---

## Decisiones de diseño importantes

1. **Sin login para el cliente.** El acceso es por URL con `sessionId` UUID (suficientemente seguro para este caso de uso). Sin fricción de registro.

2. **Guardado optimista.** Cada respuesta se envía a Supabase inmediatamente al cambiar el campo (debounce de 500ms para textareas). No hay botón "Guardar". El cliente siempre está guardado.

3. **IA completamente transparente.** Las preguntas `ai_assisted` no aparecen en el formulario del cliente. Se procesan en el servidor y sus respuestas se muestran solo en el resumen final y en el panel del diseñador.

4. **Plantilla editable desde dashboard.** El diseñador puede activar/desactivar bloques y preguntas sin tocar código (campos `is_active`). No puede añadir tipos nuevos de pregunta sin desarrollo.

5. **Progreso persistente en BD.** `current_block` y el estado de `answers` son la fuente de verdad. El localStorage es solo un caché secundario para UX instantánea.

---

## Comandos para arrancar

```bash
# 1. Levantar Supabase en Docker
docker compose up -d

# 2. Instalar dependencias
npm install

# 3. Arrancar Next.js
npm run dev

# Supabase Studio (explorador visual de la BD)
# http://localhost:3001

# App
# http://localhost:3000
```

---

## Lo que NO está en scope inicial

- Envío automático de email al cliente con el link (añadible con Resend/SendGrid en fase 2).
- Autenticación del cliente (se puede añadir si se necesita más seguridad).
- Multi-idioma.
- Versiones históricas de respuestas.