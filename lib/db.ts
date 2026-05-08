import postgres from 'postgres'

// Direct PostgreSQL connection — bypasses Supabase Kong gateway.
// TODO: migrate to @supabase/supabase-js once Kong is configured (see TODO.md)
const sql = postgres(process.env.DATABASE_URL!)

export default sql
