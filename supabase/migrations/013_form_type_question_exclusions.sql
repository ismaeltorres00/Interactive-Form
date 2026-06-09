-- Preguntas excluidas por tipo de formulario
-- Si un bloque está asignado, todas sus preguntas se incluyen por defecto.
-- Esta tabla almacena las excepciones (preguntas desactivadas para un tipo concreto).
CREATE TABLE form_type_question_exclusions (
  form_type_id uuid NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  PRIMARY KEY (form_type_id, question_id)
);
