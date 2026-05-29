"use client";

import { useState } from "react";
import { CreditCardIcon, Loader2 } from "lucide-react";
import { saveShopSetting } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoyaltyToggle({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    const newValue = !enabled;
    const res = await saveShopSetting("loyalty_enabled", String(newValue));
    
    if (res.success) {
      setEnabled(newValue);
      toast.success(newValue ? "Хөнгөлөлтийн карт идэвхжлээ" : "Хөнгөлөлтийн карт хаагдлаа");
      router.refresh();
    } else {
      toast.error(res.error || "Тохиргоог хадгалахад алдаа гарлаа");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
       <div className="flex items-center justify-between">
         <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
           <CreditCardIcon className="w-5 h-5 text-indigo-500" /> Хөнгөлөлтийн карт (Глобал)
         </h2>
         <button 
           onClick={handleToggle}
           disabled={loading}
           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${enabled ? 'bg-indigo-600' : 'bg-slate-200'} disabled:opacity-50`}
         >
           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
         </button>
       </div>
       <p className="text-sm text-slate-600">
         Энэхүү тохиргоог унтрааснаар хэрэглэгчид сагсан дээрээ хөнгөлөлтийн карт ашиглах боломжгүй болох бөгөөд админууд (DATAADMIN-аас бусад) карт нэмэх/засах боломжгүй болно.
       </p>
    </div>
  );
}
