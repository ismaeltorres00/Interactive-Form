-- Set a default ai_prompt on creencias_valores questions that don't have one yet.
-- This prompt is used by the inline IA buttons in the Creencias y Valores tool.
UPDATE questions
SET ai_prompt = 'Genera una frase de valor breve, directa e impactante (máximo 10 palabras) que encapsule la creencia y la identidad descritas. Solo devuelve la frase, sin explicaciones ni comillas.'
WHERE type = 'creencias_valores'
  AND (ai_prompt IS NULL OR ai_prompt = '');
