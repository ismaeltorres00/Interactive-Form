-- Tipos de formulario (Básico / Completo, etc.)
CREATE TABLE form_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  is_active   boolean DEFAULT true,
  "order"     int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Junction: qué bloques pertenecen a cada tipo
CREATE TABLE form_type_blocks (
  form_type_id uuid NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
  block_id     uuid NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  PRIMARY KEY (form_type_id, block_id)
);

-- Columna en sessions
ALTER TABLE sessions ADD COLUMN form_type_id uuid REFERENCES form_types(id);

-- Datos por defecto: Básico y Completo
INSERT INTO form_types (id, name, description, "order") VALUES
  ('C0000000-0000-0000-0000-000000000001', 'Básico',
   'Para clientes más pequeños. Cubre los fundamentos de marca.', 1),
  ('C0000000-0000-0000-0000-000000000002', 'Completo',
   'Para proyectos de mayor envergadura. Incluye todas las herramientas visuales.', 2);

-- Básico: bloques 1, 2 y 3 (Sobre tu empresa, Cliente ideal, Personalidad de marca)
INSERT INTO form_type_blocks (form_type_id, block_id) VALUES
  ('C0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('C0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('C0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003');

-- Completo: todos los bloques
INSERT INTO form_type_blocks (form_type_id, block_id) VALUES
  ('C0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('C0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('C0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
  ('C0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
  ('C0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'),
  ('C0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'),
  ('C0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004'),
  ('C0000000-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001');
