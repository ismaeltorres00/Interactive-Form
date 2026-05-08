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
  options     jsonb,
  ai_prompt   text,
  required    boolean DEFAULT true,
  is_active   boolean DEFAULT true
);

-- SESIONES DE CLIENTE
CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name     text NOT NULL,
  client_email    text,
  designer_id     uuid,
  status          text DEFAULT 'pending' CHECK (status IN (
                    'pending', 'in_progress', 'completed'
                  )),
  current_block   int DEFAULT 0,
  progress        int DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  drive_folder_id text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RESPUESTAS
CREATE TABLE answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid REFERENCES sessions(id) ON DELETE CASCADE,
  question_id  uuid REFERENCES questions(id) ON DELETE CASCADE,
  value        text,
  ai_generated boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (session_id, question_id)
);

-- Triggers updated_at
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

-- Vista de progreso por bloque
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

-- RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_session_access" ON sessions FOR ALL USING (true);
CREATE POLICY "client_answers_access" ON answers FOR ALL USING (true);

-- DATOS DE EJEMPLO para desarrollo
INSERT INTO blocks (id, "order", title, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 'Sobre tu empresa', 'Cuéntanos quién eres y qué hace tu negocio'),
  ('00000000-0000-0000-0000-000000000002', 2, 'Tu cliente ideal', 'Define a quién quieres llegar'),
  ('00000000-0000-0000-0000-000000000003', 3, 'Personalidad de marca', 'Cómo quieres que te perciban');

INSERT INTO questions (id, block_id, "order", label, helper_text, type, options, required) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1,
   '¿Cuál es el nombre de tu empresa o proyecto?', 'El nombre que usarás en el mercado', 'text', NULL, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2,
   '¿A qué se dedica tu empresa?', 'Descríbelo en 2-3 frases', 'textarea', NULL, true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3,
   '¿En qué sector operas?', NULL, 'select',
   '["Tecnología", "Moda y lifestyle", "Alimentación", "Salud y bienestar", "Educación", "Servicios profesionales", "Otro"]', true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 1,
   '¿Quién es tu cliente ideal?', 'Edad, género, estilo de vida, valores...', 'textarea', NULL, true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 2,
   '¿Qué problema le resuelves?', 'El dolor o necesidad principal que satisfaces', 'textarea', NULL, true),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 3,
   '¿Tienes competidores directos?', NULL, 'boolean', NULL, false),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 1,
   '¿Cómo quieres que te perciban?', 'Elige las que mejor describan tu marca', 'multiselect',
   '["Moderno", "Clásico", "Minimalista", "Atrevido", "Cercano", "Premium", "Sostenible", "Innovador"]', true),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 2,
   '¿Tienes referencias visuales que te gusten?', 'Marcas, webs, imágenes de inspiración', 'textarea', NULL, false);
