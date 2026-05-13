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
