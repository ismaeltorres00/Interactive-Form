# MarkeFlow — Formulario inteligente de branding

Aplicación web para recopilar el briefing de branding de clientes. El diseñador genera un enlace único por cliente, el cliente rellena el formulario por bloques, y la IA completa automáticamente las preguntas configuradas. Al finalizar se exporta a Word y Google Drive.

> **Estado:** Alpha — versión en desarrollo activo.

---

## Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 18+ | Necesario para Web Crypto API |
| Docker Desktop | Cualquiera reciente | Para Supabase/Postgres local |
| Git | Cualquiera | — |

---

## Instalación en un PC nuevo

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd Interactive-Form
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo de variables de entorno

Crea `.env.local` en la raíz del proyecto con este contenido:

```env
# Base de datos — conexión directa a Postgres (activo por defecto)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Supabase — descomentar cuando Kong esté configurado (ver TODO.md)
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# IA — elige un proveedor: 'gemini' | 'anthropic' | 'ollama' | 'mock'
AI_PROVIDER=ollama

# Gemini (https://aistudio.google.com/apikey)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash-lite

# Anthropic / Claude (https://console.anthropic.com/)
ANTHROPIC_API_KEY=

# Ollama (local, sin clave — requiere Ollama instalado y corriendo)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Google Drive — solo necesario para exportar a Drive
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Backoffice — login del panel de administración
ADMIN_PASSWORD=cambia-esto
ADMIN_SECRET=cadena-aleatoria-larga-y-unica

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **IMPORTANTE:** Sin `.env.local` la app no arranca. Este archivo nunca se sube al repositorio.

### 4. Levantar la base de datos con Docker

```bash
docker compose up -d
```

Docker levanta Postgres en el puerto `5432`. Las migraciones se aplican **automáticamente** al iniciar por primera vez (el volumen `./supabase/migrations` se monta en el contenedor).

Verifica que el contenedor está corriendo:

```bash
docker ps
```

Deberías ver `interactive-form-supabase-db-1` con estado `healthy`.

### 5. Arrancar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te pedirá la contraseña configurada en `ADMIN_PASSWORD`.

---

## Configuración de la IA

El proveedor se selecciona con `AI_PROVIDER` en `.env.local`. Solo necesitas configurar el que vayas a usar.

### Opción A — Ollama (local, gratis, sin clave)

1. Instala Ollama: https://ollama.com
2. Descarga un modelo:
   ```bash
   ollama pull llama3.2
   # o cualquier otro: mistral, qwen2.5-coder:7b, etc.
   ```
3. Asegúrate de que Ollama está corriendo (se inicia automáticamente al instalarlo)
4. En `.env.local`:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_MODEL=llama3.2
   ```

### Opción B — Gemini (nube, con clave gratuita)

1. Obtén una clave en https://aistudio.google.com/apikey
2. En `.env.local`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=tu-clave-aqui
   ```

### Opción C — Claude / Anthropic

1. Obtén una clave en https://console.anthropic.com
2. En `.env.local`:
   ```env
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=tu-clave-aqui
   ```

### Opción D — DeepSeek

1. Obtén una clave en https://platform.deepseek.com/api-keys
2. En `.env.local`:
   ```env
   AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=tu-clave-aqui
   DEEPSEEK_MODEL=deepseek-chat        # o deepseek-reasoner para razonamiento
   ```

### Opción E — NVIDIA NIM

1. Obtén una clave en https://build.nvidia.com (créditos gratuitos al registrarse)
2. En `.env.local`:
   ```env
   AI_PROVIDER=nvidia
   NVIDIA_API_KEY=tu-clave-aqui
   NVIDIA_MODEL=meta/llama-3.1-8b-instruct   # o nvidia/llama-3.1-nemotron-70b-instruct
   ```

### Opción F — Mock (sin IA, para pruebas de UI)

```env
AI_PROVIDER=mock
```

Devuelve respuestas de ejemplo aleatorias instantáneamente, sin hacer ninguna llamada.

---

## Estructura de la base de datos

Las migraciones están en `supabase/migrations/` y se ejecutan en orden alfabético al iniciar Docker por primera vez. Si añades una migración nueva y Docker ya está corriendo con datos, aplícala manualmente:

```bash
docker exec -i interactive-form-supabase-db-1 psql -U postgres < supabase/migrations/NNN_nombre.sql
```

### Datos de ejemplo incluidos

La migración `001_initial.sql` incluye datos de seed con 3 bloques y 8 preguntas básicas.

La migración `010_add_tool_blocks.sql` añade los 5 bloques de herramientas visuales:

| Bloque | Tipo de pregunta |
|---|---|
| Círculo de oro | `circulo_oro` |
| 5 Why's | `cinco_whys` |
| Creencias y valores | `creencias_valores` |
| Hoja de ruta | `hoja_ruta` |
| Eje XY | `eje_xy` |

> **Problema habitual:** Si cambias de PC y la BD está vacía de herramientas visuales, comprueba que la migración `010` se aplicó. Si no aparecen los bloques en el formulario, aplícala manualmente con el comando de arriba.

---

## Acceso al panel de administración

El backoffice está protegido con contraseña simple (cookie HttpOnly firmada con HMAC).

- URL: http://localhost:3000
- Contraseña: la que hayas puesto en `ADMIN_PASSWORD`
- Sesión: dura 30 días

Para cambiar la contraseña, modifica `ADMIN_PASSWORD` en `.env.local` y reinicia el servidor. Las sesiones anteriores quedan invalidadas automáticamente.

---

## Comandos útiles

```bash
# Levantar Docker
docker compose up -d

# Parar Docker
docker compose down

# Ver logs de la BD
docker logs interactive-form-supabase-db-1

# Conectarse a Postgres directamente
docker exec -it interactive-form-supabase-db-1 psql -U postgres

# Listar tablas
docker exec interactive-form-supabase-db-1 psql -U postgres -c "\dt"

# Reiniciar la BD desde cero (BORRA TODOS LOS DATOS)
docker compose down -v
docker compose up -d

# Arrancar Next.js
npm run dev

# Build de producción
npm run build && npm start
```

---

## Estructura del proyecto

```
/
├── app/
│   ├── (public)/form/[sessionId]/   ← Formulario del cliente (sin login)
│   ├── sessions/[sessionId]/        ← Detalle de sesión (admin)
│   ├── config/                      ← Configuración del formulario (admin)
│   ├── new-session/                 ← Crear nuevo cliente (admin)
│   ├── login/                       ← Login del backoffice
│   └── api/                         ← Endpoints
│       ├── answers/                 ← Guardar respuestas
│       ├── sessions/                ← CRUD sesiones
│       ├── ai-complete/             ← IA para preguntas ai_assisted
│       ├── ai-inline/               ← IA inline (ej: frase valor)
│       ├── config/                  ← Editar bloques/preguntas
│       ├── export/                  ← Exportar Word + Drive
│       └── auth/                    ← OAuth Google Drive + login admin
├── components/
│   ├── form/                        ← Wizard del formulario
│   │   └── tools/                   ← Herramientas visuales interactivas
│   └── dashboard/                   ← Componentes del panel
├── lib/
│   ├── db.ts                        ← Cliente Postgres directo
│   ├── ai.ts                        ← Wrapper multi-proveedor IA
│   ├── admin-auth.ts                ← Auth del backoffice (HMAC + cookie)
│   └── drive.ts                     ← Google Drive API
├── supabase/migrations/             ← SQL aplicado en orden al iniciar Docker
├── docker-compose.yml
└── .env.local                       ← NO subir al repo
```

---

## Problemas conocidos y soluciones

### "La app no arranca — error de base de datos"
Comprueba que Docker está corriendo: `docker ps`. Si el contenedor no está, ejecuta `docker compose up -d`.

### "Los bloques de herramientas no aparecen en el formulario"
La migración `010_add_tool_blocks.sql` no se aplicó. Ejecútala manualmente:
```bash
docker exec -i interactive-form-supabase-db-1 psql -U postgres < supabase/migrations/010_add_tool_blocks.sql
```

### "La IA no responde"
- Con Ollama: verifica que el servicio está activo (`ollama list`) y que el modelo en `OLLAMA_MODEL` está descargado.
- Con Gemini/Anthropic: verifica que la clave API es válida y tiene saldo/cuota disponible.
- Para descartar problemas de IA, cambia a `AI_PROVIDER=mock` temporalmente.

### "El login no funciona — se queda en 'Entrando...'"
Verifica que `ADMIN_PASSWORD` y `ADMIN_SECRET` están definidos en `.env.local` y que reiniciaste el servidor después de cambiarlos (`npm run dev`).

### "El progreso muestra porcentajes incorrectos"
Puede ocurrir en sesiones creadas antes de añadir preguntas `ai_assisted`. El progreso se recalcula automáticamente al guardar la siguiente respuesta.
