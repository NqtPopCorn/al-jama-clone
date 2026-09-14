import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
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
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
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
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none focus:ring-0 outline-none border-none min-h-[140px] text-xs leading-relaxed font-sans text-slate-800 dark:text-slate-200 cursor-text',
      },
    },
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

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Determine current format label
  const getCurrentFormat = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    return 'p';
  };

  const handleFormatChange = (val: string) => {
    if (val === 'h1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (val === 'h2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (val === 'h3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
  };

  return (
    <div
      className={`border rounded transition-colors flex flex-col ${
        isDark
          ? 'bg-[#0d1117] border-[#30363d] text-slate-200'
          : 'bg-white border-slate-300 text-slate-800'
      } ${className}`}
    >
      {/* Rich Text Toolbar matching screenshot layout */}
      {editable && (
        <div
          className={`flex flex-wrap items-center gap-1 px-2 py-1.5 border-b text-xs select-none ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f8fafc] border-slate-200'
          }`}
        >
          {/* 1. Format dropdown */}
          <select
            value={getCurrentFormat()}
            onChange={e => handleFormatChange(e.target.value)}
            className="h-6 px-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          {/* 2. Size dropdown */}
          <select
            defaultValue="11pt"
            className="h-6 px-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="10pt">10pt</option>
            <option value="11pt">11pt</option>
            <option value="12pt">12pt</option>
            <option value="14pt">14pt</option>
            <option value="16pt">16pt</option>
          </select>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* 3. Clipboard (Cut, Copy, Paste) */}
          <button
            type="button"
            onClick={() => document.execCommand('cut')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Cut"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('copy')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) editor.chain().focus().insertContent(text).run();
              } catch {
                document.execCommand('paste');
              }
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Paste"
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* 4. Text styling (Bold, Italic, Underline, Strikethrough, Subscript, Superscript) */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('bold')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('italic')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('underline')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Underline"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('strike')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('subscript')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Subscript"
          >
            <SubscriptIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('superscript')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 font-bold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Superscript"
          >
            <SuperscriptIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* 5. Alignment (Left, Center, Right, Justify) */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* 6. Link, Unlink, Image, Table */}
          <button
            type="button"
            onClick={setLink}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
              editor.isActive('link')
                ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
            title="Unlink"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Insert Table (3x3)"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive('table') && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="text-[10px] px-1 hover:bg-slate-200 rounded flex items-center gap-0.5"
                title="Add Row"
              >
                <Plus className="w-2.5 h-2.5" /> Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="text-[10px] px-1 hover:bg-slate-200 rounded flex items-center gap-0.5"
                title="Add Column"
              >
                <Plus className="w-2.5 h-2.5" /> Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-[10px] px-1 hover:bg-red-100 text-red-600 rounded"
                title="Delete Table"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* 7. Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300 transition-colors"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-600 dark:text-slate-300 transition-colors"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Canvas */}
      <div
        onClick={() => editor.chain().focus().run()}
        className="p-3.5 flex-1 overflow-y-auto min-h-[160px] cursor-text text-xs leading-relaxed font-sans prose prose-sm max-w-none dark:prose-invert"
      >
        <EditorContent editor={editor} className="outline-none focus:outline-none min-h-full" />
      </div>
    </div>
  );
};
