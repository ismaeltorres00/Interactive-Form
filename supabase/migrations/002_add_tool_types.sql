-- Add visual tool question types
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'text', 'textarea', 'select', 'multiselect', 'boolean', 'ai_assisted',
    'creencias_valores', 'hoja_ruta', 'circulo_oro', 'cinco_whys'
  ));
