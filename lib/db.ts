import postgres from 'postgres'

// Direct PostgreSQL connection — bypasses Supabase Kong gateway.
// TODO: migrate to @supabase/supabase-js once Kong is configured (see TODO.md)
const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 300,  // keep connections alive 5 min between requests
  connect_timeout: 10,
  keep_alive: 60,
})

export default sql
