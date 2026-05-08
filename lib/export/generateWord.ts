import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
} from 'docx'

interface QuestionData {
  id: string
  label: string
  type: string
}
interface AnswerData {
  question_id: string
  value: string
  ai_generated: boolean
}
interface BlockData {
  id: string
  title: string
  questions: QuestionData[]
}
interface SessionData {
  client_name: string
  client_email: string | null
  company_name: string | null
}

const TOOL_TYPES = ['creencias_valores', 'hoja_ruta', 'circulo_oro', 'cinco_whys', 'eje_xy']

function parseToolValue(type: string, raw: string): Record<string, string> {
  try {
    const data = JSON.parse(raw)
    if (type === 'circulo_oro') return {
      '¿Qué hace?': data.que ?? '',
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
      ;(data.items as { label: string; x: number; y: number }[] ?? []).forEach((it) => {
        const xDesc = it.x < 38 ? 'Tradicional' : it.x > 62 ? 'Moderno' : 'Centro'
        const yDesc = it.y < 38 ? 'Premium' : it.y > 62 ? 'Accesible' : 'Centro'
        out[it.label] = `${yDesc} · ${xDesc}`
      })
      return out
    }
  } catch {}
  return {}
}

const none = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 })

function buildToolTable(lines: Record<string, string>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: none(), bottom: none(), left: none(), right: none(),
    },
    rows: Object.entries(lines).map(([key, val]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'F9F9F9', color: 'auto' },
            margins: { top: 60, bottom: 60, left: 120, right: 80 },
            borders: { top: none(), bottom: none(), left: none(), right: none() },
            children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 18, color: '71717A', font: 'Calibri' })] })],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 120, right: 80 },
            borders: { top: none(), bottom: none(), left: none(), right: none() },
            children: [new Paragraph({
              children: [new TextRun({
                text: val.trim() || '—',
                size: 20,
                color: val.trim() ? '18181B' : 'A1A1AA',
                italics: !val.trim(),
                font: 'Calibri',
              })],
            })],
          }),
        ],
      })
    ),
  })
}

function gap(after = 160): Paragraph {
  return new Paragraph({ text: '', spacing: { after } })
}

export async function generateWord(
  session: SessionData,
  blocks: BlockData[],
  answerMap: Record<string, AnswerData>,
): Promise<Buffer> {
  const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const title = session.company_name ?? session.client_name
  const meta = [
    session.company_name ? `Cliente: ${session.client_name}` : null,
    session.client_email,
  ].filter(Boolean).join('  ·  ')

  const children: (Paragraph | Table)[] = []

  // ── Cover ────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 56, color: '18181B', font: 'Calibri' })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Briefing de marca', size: 28, color: '7C3AED', font: 'Calibri' })],
      spacing: { after: 80 },
    }),
    ...(meta ? [new Paragraph({
      children: [new TextRun({ text: meta, size: 20, color: '71717A', font: 'Calibri' })],
      spacing: { after: 40 },
    })] : []),
    new Paragraph({
      children: [new TextRun({ text: date, size: 20, color: '71717A', font: 'Calibri' })],
      spacing: { after: 480 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E4E4E7', space: 1 } },
    }),
  )

  // ── Blocks ───────────────────────────────────────────────────────────────
  for (const block of blocks) {
    const questions = block.questions
    if (questions.length === 0) continue

    children.push(
      new Paragraph({
        children: [new TextRun({ text: block.title.toUpperCase(), bold: true, size: 18, color: 'A1A1AA', font: 'Calibri', allCaps: true })],
        spacing: { before: 440, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E4E4E7', space: 1 } },
      }),
    )

    for (const q of questions) {
      const ans = answerMap[q.id]
      const isTool = TOOL_TYPES.includes(q.type)
      const isAi = q.type === 'ai_assisted'

      if (isTool) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: q.label, bold: true, size: 20, color: '52525B', font: 'Calibri' })],
            spacing: { before: 200, after: 80 },
          }),
        )
        const lines = ans?.value ? parseToolValue(q.type, ans.value) : {}
        if (Object.keys(lines).length) {
          children.push(buildToolTable(lines))
        } else {
          children.push(new Paragraph({
            children: [new TextRun({ text: 'Sin completar', size: 20, color: 'A1A1AA', italics: true, font: 'Calibri' })],
          }))
        }
        children.push(gap(80))

      } else if (isAi) {
        if (!ans?.value?.trim()) continue  // skip empty AI fields in export
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: q.label, bold: true, size: 20, color: '52525B', font: 'Calibri' }),
              new TextRun({ text: '  · IA', size: 16, color: '7C3AED', font: 'Calibri' }),
            ],
            spacing: { before: 200, after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: ans.value.trim(), size: 22, color: '18181B', font: 'Calibri' })],
            spacing: { after: 40 },
          }),
        )

      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: q.label, bold: true, size: 20, color: '52525B', font: 'Calibri' }),
              ...(ans?.ai_generated ? [new TextRun({ text: '  · IA', size: 16, color: '7C3AED', font: 'Calibri' })] : []),
            ],
            spacing: { before: 200, after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({
              text: ans?.value?.trim() || 'Sin respuesta',
              size: 22,
              color: ans?.value?.trim() ? '18181B' : 'A1A1AA',
              italics: !ans?.value?.trim(),
              font: 'Calibri',
            })],
            spacing: { after: 40 },
          }),
        )
      }
    }
  }

  // ── Footer line ───────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Generado con MarkeFlow  ·  ${date}`, size: 18, color: 'A1A1AA', font: 'Calibri' })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 560 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E4E4E7', space: 1 } },
    }),
  )

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } },
      },
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
