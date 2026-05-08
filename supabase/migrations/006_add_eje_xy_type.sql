-- Add eje_xy tool type to questions.type CHECK constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_type_check CHECK (type IN (
  'text', 'textarea', 'select', 'multiselect', 'boolean', 'ai_assisted',
  'creencias_valores', 'hoja_ruta', 'circulo_oro', 'cinco_whys', 'eje_xy'
));
