"use client"

import { useState, useEffect } from "react"
import { X, Map as MapIcon, Image as ImageIcon } from "lucide-react"

interface RegionMapModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "Шинэ Дархан" | "Хуучин Дархан"
}

export function RegionMapModal({ isOpen, onClose, defaultTab = "Шинэ Дархан" }: RegionMapModalProps) {
  const [activeTab, setActiveTab] = useState<"Шинэ Дархан" | "Хуучин Дархан">(defaultTab)
  const [maps, setMaps] = useState<{ newDarkhan: string, oldDarkhan: string }>({ newDarkhan: "", oldDarkhan: "" })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings/maps")
        .then(res => res.json())
        .then(data => {
          setMaps({
            newDarkhan: data.map_new_darkhan || "/maps/shine-darkhan.jpg",
            oldDarkhan: data.map_old_darkhan || "/maps/huuchin-darkhan.jpg"
          })
          setIsLoading(false)
        })
        .catch(() => setIsLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Бүсчлэлийн зураг</h2>
              <p className="text-sm text-slate-500">Та өөрийн байршилд тохирох бүсийг сонгоно уу</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 sm:px-6 pt-4 gap-2 bg-white border-b border-slate-100">
          <button
            onClick={() => setActiveTab("Шинэ Дархан")}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "Шинэ Дархан" 
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Шинэ Дархан
          </button>
          <button
            onClick={() => setActiveTab("Хуучин Дархан")}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "Хуучин Дархан" 
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Хуучин Дархан
          </button>
        </div>

        {/* Image Viewer */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6 flex items-center justify-center relative min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Уншиж байна...</p>
            </div>
          ) : activeTab === "Шинэ Дархан" ? (
            <img 
              src={maps.newDarkhan} 
              alt="Шинэ Дархан газрын зураг" 
              className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.error-msg')?.classList.remove('hidden');
              }}
            />
          ) : (
            <img 
              src={maps.oldDarkhan} 
              alt="Хуучин Дархан газрын зураг" 
              className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.error-msg')?.classList.remove('hidden');
              }}
            />
          )}
          
          <div className="error-msg hidden absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 bg-slate-100/90 backdrop-blur-sm">
            <ImageIcon className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">Зураг олдсонгүй</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md">Админ самбарын "Ерөнхий тохиргоо" хэсгээс газрын зургийг оруулж өгнө үү.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Ойлголоо, Хаах
          </button>
        </div>
      </div>
    </div>
  )
}
