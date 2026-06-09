import { unstable_cache } from 'next/cache'
import sql from '@/lib/db'
import { Block, Question } from '@/lib/types'

export const FORM_CONFIG_TAG = 'form-config'

export const getCachedFormConfig = unstable_cache(
  async (): Promise<Block[]> => {
    const rows = await sql`
      SELECT
        b.id          AS block_id,
        b."order"     AS block_order,
        b.title       AS block_title,
        b.description AS block_description,
        b.is_active   AS block_is_active,
        q.id          AS q_id,
        q."order"     AS q_order,
        q.block_id    AS q_block_id,
        q.label,
        q.helper_text,
        q.type,
        q.options,
        q.ai_prompt,
        q.required,
        q.is_active   AS q_is_active
      FROM blocks b
      LEFT JOIN questions q ON q.block_id = b.id
      ORDER BY b."order", q."order"
    `

    const blocksMap = new Map<string, Block>()
    for (const row of rows) {
      if (!blocksMap.has(row.block_id as string)) {
        blocksMap.set(row.block_id as string, {
          id: row.block_id as string,
          order: row.block_order as number,
          title: row.block_title as string,
          description: row.block_description as string | null,
          is_active: row.block_is_active as boolean,
          questions: [],
        })
      }
      if (row.q_id) {
        blocksMap.get(row.block_id as string)!.questions.push({
          id: row.q_id as string,
          block_id: row.q_block_id as string,
          order: row.q_order as number,
          label: row.label as string,
          helper_text: row.helper_text as string | null,
          type: row.type as Question['type'],
          options: row.options as string[] | null,
          ai_prompt: row.ai_prompt as string | null,
          required: row.required as boolean,
          is_active: row.q_is_active as boolean,
        })
      }
    }

    return Array.from(blocksMap.values())
  },
  [FORM_CONFIG_TAG],
  { tags: [FORM_CONFIG_TAG] },
)
