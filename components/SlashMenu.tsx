'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  UnorderedListOutlined, OrderedListOutlined,
  TableOutlined, MinusOutlined, CodeOutlined, FieldBinaryOutlined,
} from '@ant-design/icons'
import type { Editor } from '@tiptap/react'

interface SlashItem {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  action: (editor: Editor) => void
}

const items: SlashItem[] = [
  {
    key: 'h1',
    label: 'Heading 1',
    description: 'Large heading',
    icon: <span style={{ fontWeight: 700, fontSize: 18 }}>H1</span>,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    key: 'h2',
    label: 'Heading 2',
    description: 'Medium heading',
    icon: <span style={{ fontWeight: 600, fontSize: 16 }}>H2</span>,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    key: 'h3',
    label: 'Heading 3',
    description: 'Small heading',
    icon: <span style={{ fontWeight: 600, fontSize: 14 }}>H3</span>,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    key: 'p',
    label: 'Paragraph',
    description: 'Regular text',
    icon: <span style={{ fontSize: 14 }}>¶</span>,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    key: 'ul',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: <UnorderedListOutlined />,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    key: 'ol',
    label: 'Ordered List',
    description: 'Numbered list',
    icon: <OrderedListOutlined />,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    key: 'table',
    label: 'Table',
    description: 'Insert a table',
    icon: <TableOutlined />,
    action: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    key: 'hr',
    label: 'Divider',
    description: 'Horizontal rule',
    icon: <MinusOutlined />,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    key: 'code',
    label: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: <CodeOutlined />,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    key: 'variable',
    label: 'Variable',
    description: 'Insert a {{variable}} placeholder',
    icon: <FieldBinaryOutlined />,
    action: (editor) => {
      const name = prompt('Variable name:')
      if (name) {
        editor.chain().focus().setVariable(name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')).run()
      }
    },
  },
]

interface SlashMenuProps {
  editor: Editor
  open: boolean
  onClose: () => void
  position: { top: number; left: number }
  onExecute: (action: (editor: Editor) => void) => void
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ editor, open, onClose, position, onExecute }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filtered = search
    ? items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
    : items

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        execute(filtered[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Backspace' && !search) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filtered])

  useEffect(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (menuRef.current && rect.top > 0) {
        const menuHeight = menuRef.current.offsetHeight
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        if (spaceBelow < 300 && spaceAbove > menuHeight) {
          menuRef.current.style.top = `${rect.top - menuHeight - 8}px`
          menuRef.current.style.left = `${rect.left}px`
        } else {
          menuRef.current.style.top = `${rect.bottom + 8}px`
          menuRef.current.style.left = `${rect.left}px`
        }
      }
    }
  }, [open, search, filtered.length])

  const execute = useCallback(
    (item: SlashItem) => {
      onExecute(item.action)
      onClose()
    },
    [onExecute, onClose]
  )

  if (!open) return null

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        width: 280,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter..."
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            fontFamily: 'inherit',
            color: '#333',
          }}
        />
      </div>
      <div style={{ maxHeight: 260, overflow: 'auto', padding: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '12px 8px', color: '#999', fontSize: 13, textAlign: 'center' }}>
            No results
          </div>
        ) : (
          filtered.map((item, index) => (
            <div
              key={item.key}
              onClick={() => execute(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                background: index === selectedIndex ? '#f0f5ff' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <span style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: index === selectedIndex ? '#e6f4ff' : '#f5f5f5',
                color: '#1677ff',
                fontSize: 16,
              }}>
                {item.icon}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{item.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
