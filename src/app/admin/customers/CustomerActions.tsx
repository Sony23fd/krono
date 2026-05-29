"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, X, AlertTriangle } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { updateCustomer, deleteCustomer, verifyCustomerPhone } from "@/app/actions/admin-customer-actions"

interface Customer {
  id: string
  name: string | null
  phone: string | null
  address?: string | null
  orderCount: number
}

export function CustomerActions({ customer }: { customer: Customer }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Edit Form State
  const [editName, setEditName] = useState(customer.name || "")
  const [editPhone, setEditPhone] = useState(customer.phone || "")
  const [editAddress, setEditAddress] = useState(customer.address || "")
  const [editPassword, setEditPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false)

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editPhone) {
      toast.error("Утасны дугаар оруулна уу")
      return
    }

    setIsSaving(true)
    const res = await updateCustomer(customer.id, {
      name: editName,
      phone: editPhone,
      address: editAddress,
      ...(editPassword ? { password: editPassword } : {})
    })

    if (res.success) {
      toast.success("Харилцагчийн мэдээлэл шинэчлэгдлээ")
      setEditPassword("")
      setIsEditOpen(false)
    } else {
      toast.error(res.error || "Алдаа гарлаа")
    }
    setIsSaving(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const res = await deleteCustomer(customer.id)
    if (res.success) {
      toast.success("Харилцагч устгагдлаа")
      setIsDeleteOpen(false)
    } else {
      toast.error(res.error || "Алдаа гарлаа")
    }
    setIsDeleting(false)
  }

  async function handleVerifyPhone() {
    if (!customer.phone) {
      toast.error("Утасны дугаар байхгүй байна")
      return
    }
    setIsVerifyingPhone(true)
    const res = await verifyCustomerPhone(customer.phone)
    if (res.success) {
      toast.success("Утасны дугаарыг баталгаажсанд тооцлоо")
    } else {
      toast.error(res.error || "Алдаа гарлаа")
    }
    setIsVerifyingPhone(false)
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700 outline-none">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-100 p-1.5 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50"
            align="end"
          >
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 outline-none rounded-md hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
              onSelect={() => setIsEditOpen(true)}
            >
              <Edit className="w-4 h-4" />
              Засах
            </DropdownMenu.Item>
            
            {customer.phone && (
              <DropdownMenu.Item
                disabled={isVerifyingPhone}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 outline-none rounded-md hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors"
                onSelect={(e) => {
                  e.preventDefault()
                  handleVerifyPhone()
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Утас баталгаажуулах
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 outline-none rounded-md hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
              onSelect={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              Устгах
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <Dialog.Title className="text-lg font-bold text-slate-800">
                Харилцагч засах
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Нэр</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Харилцагчийн нэр"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Утас <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="99112233"
                  maxLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Шинэ нууц үг (Заавал биш)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Өөрчлөхгүй бол хоосон орхино уу"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Хаяг</label>
                <textarea
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                  placeholder="Хаягийн мэдээлэл"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Dialog.Close type="button" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Цуцлах
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Dialog */}
      <Dialog.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <Dialog.Title className="text-lg font-bold text-slate-900 mb-2">
              Харилцагч устгах
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-500 mb-6">
              Та <strong>{customer.name || customer.phone}</strong> харилцагчийг устгахдаа итгэлтэй байна уу?
              Энэ үйлдлийг буцаах боломжгүй.
            </Dialog.Description>

            <div className="flex gap-3 justify-end">
              <Dialog.Close className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Цуцлах
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Устгаж байна..." : "Устгах"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
