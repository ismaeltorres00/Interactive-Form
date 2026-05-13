-- Añadir los 4 bloques de herramientas visuales

INSERT INTO blocks (id, "order", title, description, is_active) VALUES
  ('A0000000-0000-0000-0000-000000000001', 4, 'Círculo de oro',      'Define el QUÉ, CÓMO y POR QUÉ de tu empresa (método Simon Sinek)', true),
  ('A0000000-0000-0000-0000-000000000002', 5, '5 Why''s',            'Descubre la causa raíz de tu propósito respondiendo 5 veces "¿Por qué?"', true),
  ('A0000000-0000-0000-0000-000000000003', 6, 'Creencias y valores', 'Define las creencias que guían tu marca y las frases que las expresan', true),
  ('A0000000-0000-0000-0000-000000000004', 7, 'Hoja de ruta',        'Visualiza dónde está tu empresa hoy y hacia dónde quieres llegar', true)
ON CONFLICT (id) DO NOTHING;

-- Pregunta para Círculo de oro
INSERT INTO questions (id, block_id, "order", label, helper_text, type, required, is_active) VALUES
  ('B0000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', 1,
   'Círculo de oro', 'Completa los tres niveles: ¿Qué hace tu compañía? ¿Cómo lo hace? ¿Por qué lo hace?',
   'circulo_oro', true, true)
ON CONFLICT (id) DO NOTHING;

-- Pregunta para 5 Why's
INSERT INTO questions (id, block_id, "order", label, helper_text, type, required, is_active) VALUES
  ('B0000000-0000-0000-0000-000000000002', 'A0000000-0000-0000-0000-000000000002', 1,
   '5 Why''s', 'Empieza por el síntoma y pregúntate "¿por qué?" cinco veces para llegar a la causa raíz',
   'cinco_whys', true, true)
ON CONFLICT (id) DO NOTHING;

-- Pregunta para Creencias y valores
INSERT INTO questions (id, block_id, "order", label, helper_text, type, required, is_active) VALUES
  ('B0000000-0000-0000-0000-000000000003', 'A0000000-0000-0000-0000-000000000003', 1,
   'Creencias y valores', 'Define hasta 4 creencias de tu marca, su identidad y la frase que las resume',
   'creencias_valores', true, true)
ON CONFLICT (id) DO NOTHING;

-- Pregunta para Hoja de ruta
INSERT INTO questions (id, block_id, "order", label, helper_text, type, required, is_active) VALUES
  ('B0000000-0000-0000-0000-000000000004', 'A0000000-0000-0000-0000-000000000004', 1,
   'Hoja de ruta', 'Describe la situación actual de tu empresa y tu visión a 10, 15 y 20 años',
   'hoja_ruta', true, true)
ON CONFLICT (id) DO NOTHING;

-- Bloque y pregunta para Eje XY
INSERT INTO blocks (id, "order", title, description, is_active) VALUES
  ('A0000000-0000-0000-0000-000000000005', 8, 'Eje XY', 'Posiciona tu marca y competidores en un mapa de dos ejes para visualizar tu diferenciación', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, block_id, "order", label, helper_text, type, required, is_active) VALUES
  ('B0000000-0000-0000-0000-000000000005', 'A0000000-0000-0000-0000-000000000005', 1,
   'Eje XY', 'Arrastra las marcas sobre el mapa para posicionarlas. Puedes personalizar las etiquetas de los ejes.',
   'eje_xy', true, true)
ON CONFLICT (id) DO NOTHING;
