import { db } from "@/lib/db"
import { Database, Download, AlertTriangle, Terminal } from "lucide-react"
import { getCurrentAdmin } from "@/lib/auth"
import { notFound } from "next/navigation"
import ClearDataButton from "./ClearDataButton"
import LoyaltyToggle from "./LoyaltyToggle"
import RestoreButton from "./RestoreButton"
import { getShopSettings } from "@/app/actions/settings-actions"

export const dynamic = "force-dynamic"

export default async function DataCenterPage() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "DATAADMIN") {
    notFound()
  }

  const [usersCount, ordersCount, productsCount, categoriesCount] = await Promise.all([
    db.user.count(),
    db.order.count(),
    db.product.count(),
    db.category.count()
  ])

  const settings = await getShopSettings()
  const loyaltyEnabled = settings.loyalty_enabled !== "false"

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-purple-600" />
          Өгөгдлийн төв (Data Center)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Системийн өгөгдлүүдээ найдвартай нөөцлөх (Backup) болон удирдах төв.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Нийт хэрэглэгч</span>
             <span className="text-2xl font-bold text-slate-900">{usersCount}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Нийт захиалга</span>
             <span className="text-2xl font-bold text-slate-900">{ordersCount}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Бүртгэлтэй бараа</span>
             <span className="text-2xl font-bold text-slate-900">{productsCount}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Төрөл/Ангилал</span>
             <span className="text-2xl font-bold text-slate-900">{categoriesCount}</span>
         </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LoyaltyToggle initialValue={loyaltyEnabled} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4 border-t-4 border-t-purple-500 flex flex-col">
           <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Download className="w-5 h-5 text-purple-500" /> Нөөцлөх
           </h2>
           <p className="text-sm text-slate-600 flex-1">
             Бүх датаг JSON форматаар татаж авна. Аливаа устгал хийхээс өмнө татаж нөөцлөхийг зөвлөж байна.
           </p>
           <a href="/api/admin/backup" target="_blank" className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm w-full">
              <Download className="w-4 h-4" /> Татаж авах
           </a>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4 border-t-4 border-t-blue-500 flex flex-col">
           <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Database className="w-5 h-5 text-blue-500" /> Импортлох
           </h2>
           <p className="text-sm text-slate-600 flex-1">
             Хуучин системээс бөөнөөр оруулж байгаа өгөгдлийг шинэ систем рүү хөрвүүлэн импортлох эсвэл нөөцөлсөн (JSON) датагаа шууд сэргээх хэрэгсэл.
           </p>
           <div className="flex flex-col gap-2 mt-auto">
             <RestoreButton />
             <a href="/admin/data-center/import" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm w-full">
                <Database className="w-4 h-4" /> Excel Импортлох (Бараа)
             </a>
           </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6 space-y-4 border-t-4 border-t-indigo-500 flex flex-col">
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Terminal className="w-5 h-5 text-indigo-400" /> Систем шинэчлэл
           </h2>
           <p className="text-sm text-slate-400 flex-1">
             .env файлыг засах, Github-аас сүүлийн хувилбар татах болон fix скриптүүдийг шууд ажиллуулах (Deploy).
           </p>
           <a href="/admin/data-center/system" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm w-full">
              <Terminal className="w-4 h-4" /> Тохиргоо руу орох
           </a>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6 space-y-4 border-t-4 border-t-[#F26522] flex flex-col">
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Terminal className="w-5 h-5 text-[#F26522]" /> POS Скрипт
           </h2>
           <p className="text-sm text-slate-400 flex-1">
             Касс (POS) програмаас үлдэгдэл татдаг скрипт кодоо эндээс шууд удирдах.
           </p>
           <a href="/admin/data-center/pos-script" className="inline-flex items-center justify-center gap-2 bg-[#F26522] text-white hover:bg-[#F26522]/90 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm w-full">
              <Terminal className="w-4 h-4" /> Код засах
           </a>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm p-6 space-y-4">
         <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
           <AlertTriangle className="w-5 h-5 text-red-500" /> Өгөгдөл цэвэрлэх / Устгах
         </h2>
         <p className="text-sm text-red-700 leading-relaxed">
           Системээс хуучирсан болон хэрэгцээгүй датаг массаар цэвэрлэх хэсэг. Датанд буруу үйлдэл хийснээс болж эрсдэл үүсэх тул та эхлээд заавал дээгүүрх товчоор <b>Бүрэн Backup</b> татаж авч нөөцөлсөн байх шаардлагатайг анхаарна уу!
         </p>
         
         <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <ClearDataButton adminRole={admin.role} />
         </div>
      </div>
    </div>
  )
}
