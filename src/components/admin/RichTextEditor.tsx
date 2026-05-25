"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import "react-quill/dist/quill.snow.css"

interface Props {
  name: string
  defaultValue?: string
  placeholder?: string
}

export function RichTextEditor({ name, defaultValue, placeholder }: Props) {
  const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), [])
  const [value, setValue] = useState(defaultValue || "")

  return (
    <div className="bg-white rounded-md border border-slate-200 overflow-hidden [&_.ql-container]:min-h-[150px] [&_.ql-container]:text-sm [&_.ql-editor]:font-sans">
      <input type="hidden" name={name} value={value} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"]
          ]
        }}
      />
    </div>
  )
}
