'use client'

import { useEffect, useMemo, useState } from 'react'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  className = '',
}: RichTextEditorProps) {
  const [QuillComponent, setQuillComponent] = useState<any>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let isMounted = true
    import('react-quill')
      .then((mod) => {
        if (!isMounted) return
        setQuillComponent(() => mod.default)
      })
      .catch((error) => {
        console.error('Failed to load rich text editor chunk, using textarea fallback:', error)
        if (!isMounted) return
        setLoadError(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image'],
        ['blockquote', 'code-block'],
        ['clean'],
      ],
    }),
    []
  )

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'indent',
    'align',
    'link',
    'image',
    'blockquote',
    'code-block',
  ]

  if (loadError) {
    return (
      <div className={`rich-text-editor ${className}`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900"
        />
      </div>
    )
  }

  if (!QuillComponent) {
    return (
      <div className="w-full h-48 rounded-lg border border-slate-300 bg-slate-50 animate-pulse flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading editor...</span>
      </div>
    )
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <QuillComponent
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white rounded-lg"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 200px;
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f8fafc;
        }
        .rich-text-editor .ql-editor {
          min-height: 180px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}

