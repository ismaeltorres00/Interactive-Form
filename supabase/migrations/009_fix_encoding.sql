-- Fix encoding corruption: í displayed as ?
UPDATE questions SET label       = REPLACE(label,       'C?rculo', 'Círculo') WHERE label       LIKE '%C?rculo%';
UPDATE questions SET helper_text = REPLACE(helper_text, 'C?rculo', 'Círculo') WHERE helper_text LIKE '%C?rculo%';
UPDATE blocks    SET title       = REPLACE(title,       'C?rculo', 'Círculo') WHERE title       LIKE '%C?rculo%';
UPDATE blocks    SET description = REPLACE(description, 'C?rculo', 'Círculo') WHERE description LIKE '%C?rculo%';
