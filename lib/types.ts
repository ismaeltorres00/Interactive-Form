export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'ai_assisted'
  | 'creencias_valores'
  | 'hoja_ruta'
  | 'circulo_oro'
  | 'cinco_whys'
  | 'eje_xy'

export const TOOL_TYPES: QuestionType[] = [
  'creencias_valores',
  'hoja_ruta',
  'circulo_oro',
  'cinco_whys',
  'eje_xy',
]

export interface Block {
  id: string
  order: number
  title: string
  description: string | null
  is_active: boolean
  questions: Question[]
}

export interface Question {
  id: string
  block_id: string
  order: number
  label: string
  helper_text: string | null
  type: QuestionType
  options: string[] | null
  ai_prompt: string | null
  required: boolean
  is_active: boolean
}

export interface FormType {
  id: string
  name: string
  description: string | null
  is_active: boolean
  order: number
  created_at: string
}

export interface FormTypeWithBlocks extends FormType {
  blockIds: string[]
  excludedQuestionIds: string[]
}

export interface Session {
  id: string
  client_name: string
  client_email: string | null
  company_name: string | null
  form_type_id: string | null
  status: 'pending' | 'in_progress' | 'pending_ai_review' | 'completed'
  current_block: number
  progress: number
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  session_id: string
  question_id: string
  value: string
  ai_generated: boolean
  is_active: boolean
}
