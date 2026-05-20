import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VariableTag } from '@/components/VariableTag'

export interface VariableOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      setVariable: (name: string) => ReturnType
    }
  }
}

export const VariableNode = Node.create<VariableOptions>({
  name: 'variable',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-name'),
        renderHTML: (attrs) => ({ 'data-name': attrs.name }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-variable': '', 'data-name': node.attrs.name }),
      `{{${node.attrs.name}}}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableTag)
  },

  addCommands() {
    return {
      setVariable:
        (name: string) =>
        ({ chain }) =>
          chain().insertContent({
            type: this.name,
            attrs: { name },
          }).run(),
    }
  },
})
