"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { updateSystemFromServer } from "@/app/actions/system-actions"

export function SystemUpdateCard() {

  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState<"idle" | "updating" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleUpdate() {
    if (!confirm("Та системийг GitHub-аас шинэчлэхдээ итгэлтэй байна уу? Энэ процесс 1-3 минут үргэлжлэх бөгөөд сайт түр зуур ажиллахгүй болно.")) {
      return
    }

    setIsUpdating(true)
    setStatus("updating")
    setErrorMsg("")

    try {
      // NOTE: pm2 restart will eventually terminate the request.
      // We expect a network error or timeout. We treat that as "Success, restarting..."
      const res = await updateSystemFromServer()
      
      if (res.success) {
        setStatus("success")
        toast.success("Шинэчлэлт амжилттай: " + res.message)
      } else {
        setStatus("error")
        setErrorMsg(res.error || "Шинэчлэх явцад алдаа гарлаа.")
        toast.error(res.error || "Алдаа гарлаа")
      }
    } catch (error: any) {
      // If we get a network error while pm2 is restarting, it's actually success
      console.log("Caught expected restart error:", error)
      setStatus("success")
      toast.success("Шинэчлэлт эхэллээ. Сервер дахин ачаалж байна.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="border-amber-200 shadow-sm mt-8 bg-amber-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 text-amber-600 ${isUpdating ? 'animate-spin' : ''}`} />
          <CardTitle className="text-amber-900">Систем Шинэчлэх (GitHub Update)</CardTitle>
        </div>
        <CardDescription className="text-amber-700/80">
          GitHub дээрх хамгийн сүүлийн үеийн кодыг татаж аваад сайтыг шинэчилнэ. Энэ процесс нь програмыг бүхэлд нь шинээр угсарч (build), сервер (PM2) дахин ачаалахад хэдэн минут зарцуулдаг.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-100/50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">АНХААРУУЛГА:</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Шинэчлэлт хийгдэж байх үед сайт түр зуур (1-3 минут) ажиллахгүй болно.</li>
              <li>Процессыг дундаас нь тасалж болохгүй.</li>
              <li>Бүх систем (Data, Бараа, Захиалга) аюулгүй үлдэх бөгөөд зөвхөн програмын код (Logic) болон загвар шинэчлэгдэнэ.</li>
            </ul>
          </div>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Систем амжилттай шинэчлэгдэж дууслаа. Сайт удахгүй ердийн горимд шилжинэ.
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm font-medium">
            <XCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-amber-100/30 border-t border-amber-200 flex justify-end p-4">
        <Button 
          onClick={handleUpdate} 
          disabled={isUpdating}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md px-8"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ШИНЭЧИЛЖ БАЙНА...
            </>
          ) : (
            "GITHUВ-ААС ШИНЭЧЛЭХ"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
