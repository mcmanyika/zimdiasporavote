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
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const maxRetries = 3
    const loadEditor = async () => {
      try {
        const mod = await import('react-quill')
        if (!isMounted) return
        setQuillComponent(() => mod.default)
        setLoadError(false)
      } catch (error) {
        if (!isMounted) return

        if (retryCount < maxRetries) {
          const delayMs = 300 * (retryCount + 1)
          setTimeout(() => {
            if (isMounted) setRetryCount((prev) => prev + 1)
          }, delayMs)
          return
        }

        console.error('Failed to load rich text editor chunk, using textarea fallback:', error)
        setLoadError(true)
      }
    }

    void loadEditor()

    return () => {
      isMounted = false
    }
  }, [retryCount])

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
        <div className="mb-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span>Rich text editor could not load. Using fallback editor.</span>
          <button
            type="button"
            onClick={() => {
              setLoadError(false)
              setRetryCount(0)
            }}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
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

