"use client"

import { toast } from "sonner"
import { ReactNode, useRef } from "react"

interface ActionFormProps {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string } | void | any>
  children: ReactNode
  className?: string
  successMessage?: string
  onSuccess?: () => void
}

export function ActionForm({ action, children, className, successMessage = "Амжилттай хадгалагдлаа", onSuccess }: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const clientAction = async (formData: FormData) => {
    const promise = action(formData)

    toast.promise(promise, {
      loading: "Түр хүлээнэ үү...",
      success: (result: any) => {
        if (result && result.success === false) {
          throw new Error(result.error || "Алдаа гарлаа")
        }
        
        // Reset form on success if it's a create action (optional, but good UX)
        if (onSuccess) onSuccess()
        return successMessage
      },
      error: (err: any) => err.message || "Үйлдэл амжилтгүй боллоо",
    })
  }

  return (
    <form ref={formRef} action={clientAction} className={className}>
      {children}
    </form>
  )
}
