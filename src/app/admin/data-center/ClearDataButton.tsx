"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { clearAllData } from "@/app/actions/clear-actions";
import { toast } from "sonner";

interface Props {
  adminRole: string;
}

export default function ClearDataButton({ adminRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = async () => {
    setError(null);
    if (adminRole !== "DATAADMIN") {
      setError("Зөвхөн DATAADMIN эрхтэй хэрэглэгч устгах боломжтой!");
      return;
    }

    const userInput = window.prompt(
      "АНХААР!\nТа системд байгаа БҮХ ЗАХИАЛГА, БАГЦ, БАРАА, АНГИЛАЛ устгах гэж байна.\nЭнэ үйлдэл буцаагдахгүй!\nБаталгаажуулахын тулд доор: УСТГАХ гэж бичнэ үү:"
    );

    if (userInput !== "УСТГАХ") {
      if (userInput !== null) {
        toast.error("Та буруу бичсэн тул үйлдэл цуцлагдлаа.");
      }
      return;
    }

    setLoading(true);
    const promise = clearAllData();
    
    toast.promise(promise, {
      loading: "Бүх өгөгдлийг устгаж байна...",
      success: (res) => {
        setLoading(false);
        if (res.success) {
          window.location.reload();
          return "Бүх өгөгдлийг амжилттай устгаж цэвэрлэлээ.";
        }
        throw new Error(res.error || "Устгахад алдаа гарлаа");
      },
      error: (err) => {
        setLoading(false);
        setError(err.message);
        return err.message;
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={handleClear} 
        disabled={loading || adminRole !== "DATAADMIN"}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <Trash2 className="w-5 h-5" />
        )}
        Бүх датаг шууд устгах ({adminRole === "DATAADMIN" ? 'Идэвхтэй' : 'Зөвхөн Data Admin'})
      </button>

      {error && (
        <div className="text-red-600 text-sm flex items-center gap-2 px-1 mt-1">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  );
}
