'use client'

import { useState } from 'react'
import { Block, FormTypeWithBlocks } from '@/lib/types'
import { FormConfig } from './FormConfig'
import { FormTypeConfig } from './FormTypeConfig'

interface Props {
  blocks: Block[]
  formTypes: FormTypeWithBlocks[]
}

export function ConfigTabs({ blocks, formTypes }: Props) {
  const [tab, setTab] = useState<'blocks' | 'types'>('blocks')

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition ${
      active
        ? 'bg-kb-accent text-kb-black'
        : 'text-kb-gray-600 hover:text-kb-black dark:text-zinc-400 dark:hover:text-white'
    }`

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button className={tabClass(tab === 'blocks')} onClick={() => setTab('blocks')}>
          Bloques y preguntas
        </button>
        <button className={tabClass(tab === 'types')} onClick={() => setTab('types')}>
          Tipos de formulario
        </button>
      </div>

      {tab === 'blocks' ? (
        <FormConfig initialBlocks={blocks} />
      ) : (
        <FormTypeConfig blocks={blocks} initialFormTypes={formTypes} />
      )}
    </div>
  )
}
