import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Plus,
  Trash2,
} from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store';

interface TiptapEditorProps {
  content?: string | null;
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  editable = true,
  placeholder = 'Type your description here...',
  className = '',
}) => {
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline font-medium hover:text-blue-800',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return (
      <div className="p-4 border rounded-md border-slate-200 bg-slate-50 animate-pulse text-xs text-slate-500">
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      className={`border rounded-md transition-colors flex flex-col ${
        isDark
          ? 'bg-[#0d1117] border-[#30363d] text-slate-200'
          : 'bg-white border-slate-300 text-slate-800'
      } ${className}`}
    >
      {/* 1. Rich Text Toolbar (matching Jama Connect Image 1 & 4) */}
      {editable && (
        <div
          className={`flex flex-wrap items-center gap-0.5 p-1.5 border-b text-xs select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f4f6f8] border-slate-200'
          }`}
        >
          {/* Heading 1-3 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-slate-200 dark:bg-slate-700 font-bold'
                : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-slate-200 dark:bg-slate-700 font-bold'
                : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-slate-200 dark:bg-slate-700 font-bold'
                : ''
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Formatting: Bold, Italic, Strikethrough, Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('bold')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('italic')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('strike')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('code')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Lists & Quote */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('bulletList')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('orderedList')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('blockquote')
                ? 'bg-slate-200 dark:bg-slate-700 font-bold text-blue-600'
                : ''
            }`}
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Table Operations */}
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Insert Table (3x3)"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive('table') && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] flex items-center gap-0.5"
                title="Add Row"
              >
                <Plus className="w-3 h-3" /> Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] flex items-center gap-0.5"
                title="Add Column"
              >
                <Plus className="w-3 h-3" /> Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-1.5 rounded hover:bg-red-100 text-red-600"
                title="Delete Table"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Link */}
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
              editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : ''
            }`}
            title="Insert / Edit Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Editor Canvas with Tiptap ProseMirror styling */}
      <div className="p-3 flex-1 overflow-y-auto min-h-[140px] text-xs leading-relaxed font-sans prose prose-sm max-w-none dark:prose-invert">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
};
