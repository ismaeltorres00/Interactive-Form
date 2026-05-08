# TODO — MarkeFlow

## Deuda técnica

### Migrar a Supabase completo (Kong + Auth)
- [ ] Generar `kong.yml` con las JWT anon/service keys reales
- [ ] Crear el par de keys JWT (`NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Actualizar `.env.local`: descomentar vars de Supabase, eliminar `DATABASE_URL`
- [ ] Reemplazar `lib/db.ts` (postgres directo) por `lib/supabase/server.ts` (@supabase/supabase-js)
- [ ] Actualizar todas las queries en `app/` y `app/api/` para usar el cliente Supabase
- [ ] Activar Row Level Security real (restringir `client_session_access` por sessionId)
- [ ] Añadir Supabase Auth para el panel del diseñador (`/app/(admin)/`)

---

## Fase 2 — Funcionalidades pendientes

- [ ] Integración Claude API (`/api/ai-complete`) — completar preguntas `ai_assisted`
- [ ] Exportación Word (`lib/export/generateWord.ts`) con librería `docx`
- [ ] Exportación PDF (`lib/export/generatePdf.ts`) con `@react-pdf/renderer` o Puppeteer
- [ ] Google Drive API — subir documentos al Drive del diseñador (`lib/drive.ts`)
- [ ] OAuth2 Google en el dashboard (`/api/auth/google/callback`)
- [ ] Panel del diseñador completo — edición de respuestas, exportar desde dashboard
- [ ] Envío automático de email al cliente con el link (Resend o SendGrid)
