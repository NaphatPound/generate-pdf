'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  OrderedListOutlined, UnorderedListOutlined,
  UndoOutlined, RedoOutlined, EyeOutlined, EditOutlined,
} from '@ant-design/icons'
import { VariableNode } from '@/lib/variable-node'
import { SlashMenu } from './SlashMenu'

interface TemplateEditorProps {
  value: string
  onChange: (html: string) => void
}

function extractBodyContent(fullHtml: string): string {
  const match = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return match ? match[1].trim() : fullHtml
}

function wrapBodyContent(bodyContent: string, originalHtml: string): string {
  const headMatch = originalHtml.match(/<head>[\s\S]*<\/head>/i)
  const styleMatch = originalHtml.match(/<style[^>]*>[\s\S]*<\/style>/i)
  const bodyAttrs = originalHtml.match(/<body([^>]*)>/i)
  const attrs = bodyAttrs ? bodyAttrs[1] : ''
  const headContent = headMatch ? headMatch[0] : (styleMatch ? `<head>${styleMatch[0]}</head>` : '<head><meta charset="utf-8"></head>')
  return `<!DOCTYPE html>\n<html>\n${headContent}\n<body${attrs}>\n${bodyContent}\n</body>\n</html>`
}

function convertHtmlToTiptap(html: string): string {
  return html.replace(/\{\{(\w+)\}\}/g, '<span data-variable data-name="$1">{{$1}}</span>')
}

function convertTiptapToHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const spans = doc.querySelectorAll('span[data-variable]')
  spans.forEach((span) => {
    const name = span.getAttribute('data-name') || ''
    const textNode = doc.createTextNode(`{{${name}}}`)
    span.parentNode?.replaceChild(textNode, span)
  })
  return doc.body.innerHTML
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ value, onChange }) => {
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 })
  const [previewMode, setPreviewMode] = useState(false)
  const [bodyContent, setBodyContent] = useState('')
  const slashPosRef = useRef<number | null>(null)

  useEffect(() => {
    setBodyContent(extractBodyContent(value || ''))
  }, [value])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Type / for commands, or start typing...' }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      VariableNode,
    ],
    content: convertHtmlToTiptap(bodyContent),
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          const { state } = view
          const { selection } = state
          const { $from } = selection
          const textBefore = $from.parent.textBetween(0, $from.parentOffset)
          if (textBefore === '' || textBefore.endsWith(' ')) {
            slashPosRef.current = $from.pos
            const coords = view.coordsAtPos($from.pos)
            setSlashPos({ top: coords.top + 28, left: coords.left })
            setTimeout(() => setSlashOpen(true), 0)
            return false
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const converted = convertTiptapToHtml(html)
      const fullHtml = wrapBodyContent(converted, value || '')
      onChange(fullHtml)
    },
  })

  useEffect(() => {
    if (editor && bodyContent) {
      const currentHtml = convertHtmlToTiptap(bodyContent)
      if (editor.getHTML() !== currentHtml) {
        editor.commands.setContent(currentHtml)
      }
    }
  }, [bodyContent])

  const handleInsertVariable = useCallback(() => {
    const name = prompt('Variable name:')
    if (name && editor) {
      editor.chain().focus().setVariable(
        name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
      ).run()
    }
  }, [editor])

  const handleSlashExecute = useCallback((action: (editor: any) => void) => {
    if (editor && slashPosRef.current !== null) {
      editor.chain().focus().deleteRange({ from: slashPosRef.current, to: slashPosRef.current + 1 }).run()
    }
    slashPosRef.current = null
    action(editor)
  }, [editor])

  if (!editor) return null

  const ToolbarBtn: React.FC<{
    active?: boolean
    onClick: () => void
    children: React.ReactNode
    title?: string
  }> = ({ active, onClick, children, title }) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        background: active ? '#e6f4ff' : 'transparent',
        color: active ? '#1677ff' : '#595959',
        fontSize: 16,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#f5f5f5'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )

  const SectionBtn: React.FC<{
    label: string
    onClick: () => void
  }> = ({ label, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        cursor: 'pointer',
        background: '#fff',
        fontSize: 12,
        color: '#595959',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1677ff'; e.currentTarget.style.color = '#1677ff' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d9d9d9'; e.currentTarget.style.color = '#595959' }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      border: '1px solid #d9d9d9',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#fff',
    }}>
      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '6px 8px',
        borderBottom: '1px solid #f0f0f0',
        flexWrap: 'wrap',
      }}>
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <UndoOutlined />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <RedoOutlined />
        </ToolbarBtn>

        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />

        <ToolbarBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <BoldOutlined />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <ItalicOutlined />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineOutlined />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <StrikethroughOutlined />
        </ToolbarBtn>

        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />

        <ToolbarBtn
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align left"
        >
          <AlignLeftOutlined />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align center"
        >
          <AlignCenterOutlined />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align right"
        >
          <AlignRightOutlined />
        </ToolbarBtn>

        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />

        <ToolbarBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <UnorderedListOutlined />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        >
          <OrderedListOutlined />
        </ToolbarBtn>

        <div style={{ flex: 1 }} />

        <SectionBtn label="+ Variable" onClick={handleInsertVariable} />

        <div style={{ width: 8 }} />

        <button
          onClick={() => {
            setPreviewMode(!previewMode)
            if (!previewMode) {
              editor.setEditable(false)
            } else {
              editor.setEditable(true)
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            cursor: 'pointer',
            background: previewMode ? '#e6f4ff' : '#fff',
            fontSize: 12,
            color: previewMode ? '#1677ff' : '#595959',
            transition: 'all 0.15s',
          }}
        >
          {previewMode ? <EditOutlined /> : <EyeOutlined />}
          {previewMode ? 'Edit' : 'Preview'}
        </button>
      </div>

      {}
      <div style={{
        padding: '20px 24px',
        minHeight: 400,
        maxHeight: 600,
        overflow: 'auto',
        cursor: previewMode ? 'default' : 'text',
      }}>
        <style>{`
          .tiptap-editor {
            outline: none;
            min-height: 360px;
            font-size: 14px;
            line-height: 1.7;
            color: #1a1a1a;
          }
          .tiptap-editor h1 { font-size: 28px; font-weight: 700; margin: 16px 0 8px; line-height: 1.3; }
          .tiptap-editor h2 { font-size: 22px; font-weight: 600; margin: 14px 0 6px; line-height: 1.3; }
          .tiptap-editor h3 { font-size: 18px; font-weight: 600; margin: 12px 0 4px; line-height: 1.3; }
          .tiptap-editor p { margin: 4px 0; }
          .tiptap-editor ul, .tiptap-editor ol { padding-left: 24px; margin: 4px 0; }
          .tiptap-editor li { margin: 2px 0; }
          .tiptap-editor hr { margin: 16px 0; border: none; border-top: 2px solid #e8e8e8; }
          .tiptap-editor pre {
            background: #f5f5f5;
            border-radius: 6px;
            padding: 12px 16px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
            margin: 8px 0;
          }
          .tiptap-editor table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          .tiptap-editor th, .tiptap-editor td {
            border: 1px solid #d9d9d9;
            padding: 8px 12px;
            text-align: left;
            min-width: 60px;
          }
          .tiptap-editor th {
            background: #fafafa;
            font-weight: 600;
          }
          .tiptap-editor p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #bfbfbf;
            pointer-events: none;
            height: 0;
          }
          .tiptap-editor [data-variable] {
            cursor: pointer;
          }
          .tiptap-editor blockquote {
            border-left: 3px solid #d9d9d9;
            padding-left: 12px;
            margin: 8px 0;
            color: #595959;
            font-style: italic;
          }
        `}</style>
        <EditorContent editor={editor} />
        <SlashMenu
          editor={editor}
          open={slashOpen}
          onClose={() => setSlashOpen(false)}
          position={slashPos}
          onExecute={handleSlashExecute}
        />
      </div>
    </div>
  )
}
