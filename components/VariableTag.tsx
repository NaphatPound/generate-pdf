'use client'

import React from 'react'
import type { NodeViewProps } from '@tiptap/react'

export const VariableTag: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(node.attrs.name || '')

  const handleClick = () => {
    if (!editing) {
      setEditing(true)
      setName(node.attrs.name || '')
    }
  }

  const handleSave = () => {
    const trimmed = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    if (trimmed) {
      updateAttributes({ name: trimmed })
    } else {
      deleteNode()
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#e6f4ff',
          border: '2px solid #1677ff',
          borderRadius: 4,
          padding: '0 4px',
          margin: '0 2px',
          fontSize: 13,
          lineHeight: '22px',
          verticalAlign: 'middle',
        }}
      >
        <span style={{ color: '#1677ff', fontWeight: 600, marginRight: 2 }}>{'{{'}</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: Math.max(name.length * 8, 20),
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#1677ff',
            fontWeight: 600,
          }}
        />
        <span style={{ color: '#1677ff', fontWeight: 600, marginLeft: 2 }}>{'}}'}</span>
      </span>
    )
  }

  return (
    <span
      onClick={handleClick}
      contentEditable={false}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#e6f4ff',
        border: '1px solid #91caff',
        borderRadius: 4,
        padding: '0 4px',
        margin: '0 2px',
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: '22px',
        verticalAlign: 'middle',
        userSelect: 'none',
      }}
      title="Click to rename"
    >
      <span style={{ color: '#1677ff', fontWeight: 600, marginRight: 1 }}>{'{{'}</span>
      <span style={{ color: '#1677ff', fontWeight: 600 }}>{node.attrs.name}</span>
      <span style={{ color: '#1677ff', fontWeight: 600, marginLeft: 1 }}>{'}}'}</span>
    </span>
  )
}
