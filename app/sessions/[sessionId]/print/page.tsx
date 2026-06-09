import { notFound } from 'next/navigation'
import sql from '@/lib/db'
import { Question } from '@/lib/types'
import { PrintTrigger } from './PrintTrigger'

interface Props {
  params: { sessionId: string }
}

// Parse JSON tool answers into readable text lines
function parseToolValue(type: string, raw: string): Record<string, string> {
  try {
    const data = JSON.parse(raw)
    if (type === 'circulo_oro') return {
      '¿Qué hace tu compañía?': data.que ?? '',
      '¿Cómo lo hace?': data.como ?? '',
      '¿Por qué lo hace?': data.porque ?? '',
    }
    if (type === 'cinco_whys') return {
      'Why 1': data.why1 ?? '', 'Why 2': data.why2 ?? '',
      'Why 3': data.why3 ?? '', 'Why 4': data.why4 ?? '',
      'Why 5': data.why5 ?? '',
    }
    if (type === 'creencias_valores') {
      const out: Record<string, string> = {}
      ;(data as { creo: string; somos: string; frase: string }[]).forEach((e, i) => {
        if (e.creo || e.somos || e.frase) {
          out[`${i + 1}. Creemos que`] = e.creo ?? ''
          out[`   Por tanto somos`] = e.somos ?? ''
          out[`   Frase valor`] = e.frase ?? ''
        }
      })
      return out
    }
    if (type === 'hoja_ruta') return {
      'Hoy': data.hoy ?? '',
      '10 años': data.y10 ?? '',
      '15 años': data.y15 ?? '',
      '20 años': data.y20 ?? '',
    }
    if (type === 'eje_xy') {
      const out: Record<string, string> = {}
      ;(data.items as { label: string; x: number; y: number }[]).forEach((it) => {
        const xDesc = it.x < 38 ? 'Tradicional' : it.x > 62 ? 'Moderno' : 'Centro'
        const yDesc = it.y < 38 ? 'Premium' : it.y > 62 ? 'Accesible' : 'Centro'
        out[it.label] = `${yDesc} · ${xDesc}`
      })
      return out
    }
    return { Valor: raw }
  } catch {
    return { Valor: raw }
  }
}

export default async function PrintPage({ params }: Props) {
  const [session] = await sql`SELECT * FROM sessions WHERE id = ${params.sessionId}`
  if (!session) notFound()

  const blocks = await sql`SELECT * FROM blocks WHERE is_active = true ORDER BY "order"`
  const questions = await sql`SELECT * FROM questions WHERE is_active = true ORDER BY "order"` as Question[]
  const answers = await sql`SELECT * FROM answers WHERE session_id = ${params.sessionId} AND is_active = true`

  const answerMap = Object.fromEntries(
    (answers as unknown as { question_id: string; value: string; ai_generated: boolean }[])
      .map((a) => [a.question_id, a])
  )

  const blocksWithQuestions = (blocks as unknown as { id: string; title: string; order: number }[]).map((b) => ({
    ...b,
    questions: questions.filter((q) => q.block_id === b.id && q.type !== 'ai_assisted'),
  }))

  const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const TOOL_TYPES = ['creencias_valores', 'hoja_ruta', 'circulo_oro', 'cinco_whys', 'eje_xy']

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Briefing · ${session.company_name ?? session.client_name}`}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, 'Times New Roman', serif; color: #18181b; background: #fff; }
          .page { max-width: 740px; margin: 0 auto; padding: 48px 40px; }
          .header { border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 36px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header-left h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
          .header-left p { font-size: 13px; color: #71717a; margin-top: 4px; }
          .header-right { font-size: 12px; color: #71717a; text-align: right; }
          .brand { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; }
          .section { margin-bottom: 36px; page-break-inside: avoid; }
          .section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px; margin-bottom: 16px; }
          .question { margin-bottom: 16px; }
          .question-label { font-size: 11px; font-weight: 600; color: #71717a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
          .question-value { font-size: 14px; color: #18181b; line-height: 1.6; }
          .question-value.empty { color: #d4d4d8; font-style: italic; }
          .tool-block { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
          .tool-row { display: flex; gap: 12px; margin-bottom: 8px; }
          .tool-row:last-child { margin-bottom: 0; }
          .tool-key { font-size: 11px; font-weight: 600; color: #71717a; min-width: 140px; flex-shrink: 0; padding-top: 2px; }
          .tool-val { font-size: 13px; color: #18181b; line-height: 1.5; }
          .tool-val.empty { color: #d4d4d8; font-style: italic; }
          .ai-badge { display: inline-block; background: #f3f0ff; color: #7c3aed; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 3px; margin-left: 6px; vertical-align: middle; }
          .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e4e4e7; display: flex; justify-content: space-between; font-size: 11px; color: #a1a1aa; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #7c3aed; color: #fff; border: none; border-radius: 10px; padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
          @media print {
            .print-btn { display: none; }
            body { font-size: 11pt; }
            .page { padding: 0; max-width: 100%; }
            .section { page-break-inside: avoid; }
          }
        `}</style>
      </head>
      <body>
        <PrintTrigger />
        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1>{session.company_name ?? session.client_name}</h1>
              <p>{session.company_name ? `Cliente: ${session.client_name}` : ''}{session.client_email ? ` · ${session.client_email}` : ''}</p>
            </div>
            <div className="header-right">
              <div className="brand">KINTON</div>
              <div style={{ marginTop: 4 }}>{date}</div>
            </div>
          </div>

          {/* Content */}
          {blocksWithQuestions.map((block) => {
            const qs = block.questions.filter((q) => q.is_active)
            if (qs.length === 0) return null
            return (
              <div key={block.id} className="section">
                <div className="section-title">{block.title}</div>
                {qs.map((q) => {
                  const ans = answerMap[q.id]
                  const isTool = TOOL_TYPES.includes(q.type)

                  if (isTool) {
                    const lines = ans?.value ? parseToolValue(q.type, ans.value) : {}
                    const hasAny = Object.values(lines).some((v) => v.trim() !== '')
                    return (
                      <div key={q.id} className="question">
                        <div className="question-label">{q.label}</div>
                        <div className="tool-block">
                        {hasAny ? Object.entries(lines).map(([k, v]) => (
                          <div key={k} className="tool-row">
                            <span className="tool-key">{k}</span>
                            <span className={`tool-val${v.trim() ? '' : ' empty'}`}>{v.trim() || '—'}</span>
                          </div>
                        )) : (
                          <span className="tool-val empty">Sin completar</span>
                        )}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={q.id} className="question">
                      <div className="question-label">
                        {q.label}
                        {ans?.ai_generated && <span className="ai-badge">IA</span>}
                      </div>
                      <div className={`question-value${ans?.value?.trim() ? '' : ' empty'}`}>
                        {ans?.value?.trim() || 'Sin respuesta'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Footer */}
          <div className="footer">
            <span>Generado con MarkeFlow</span>
            <span>{session.company_name ?? session.client_name} · {date}</span>
          </div>
        </div>
      </body>
    </html>
  )
}
