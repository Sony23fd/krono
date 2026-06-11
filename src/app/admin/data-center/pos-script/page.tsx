import { getCurrentAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getShopSettings } from "@/app/actions/settings-actions"
import { PosScriptEditor } from "./PosScriptEditor"
import { TerminalSquare } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PosScriptPage() {
  const admin = await getCurrentAdmin()
  
  // Зөвхөн DATAADMIN харах эрхтэй (ADMIN-д ч харагдахгүй гэж захисан)
  if (!admin || admin.role !== "DATAADMIN") {
    redirect("/admin/home")
  }

  const settings = await getShopSettings()
  const currentScript = settings["POS_SYNC_SCRIPT"] || ""

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TerminalSquare className="w-6 h-6 text-[#F26522]" />
          POS Скрипт Тохиргоо
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Энэ хэсэгт POS машин дээр ажиллаж буй барааны үлдэгдэл татах скриптийг тохируулна. 
          Кодоо энд хадгалснаар POS ком нь 5 минут тутамд автоматаар шинэчлэгдэнэ.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
        <PosScriptEditor initialScript={currentScript} />
      </div>
    </div>
  )
}
