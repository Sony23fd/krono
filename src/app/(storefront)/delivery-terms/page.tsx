import { Truck } from "lucide-react"

export const metadata = {
  title: "Хүргэлтийн нөхцөл - Bileg Supermarket",
  description: "Bileg Supermarket хүргэлтийн нөхцөл",
}

export default function DeliveryTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b">
          <Truck className="w-8 h-8 text-[#F26522]" />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Хүргэлтийн нөхцөл</h1>
        </div>
        
        <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800">
          <div className="bg-slate-50 p-6 md:p-8 rounded-xl border border-slate-100">
            <ul className="text-slate-700 space-y-4 text-base md:text-lg leading-relaxed list-none p-0 m-0">
              <li className="flex gap-3">
                <span className="text-[#F26522] mt-1 text-sm">●</span>
                <span>Хүргэлт нь Дархан хот дотор заагдсан бүсэд үйлчилнэ</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F26522] mt-1 text-sm">●</span>
                <span>Хүргэлтийн төлбөрийг хэрэглэгч тал бүрэн хариуцна</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F26522] mt-1 text-sm">●</span>
                <span>Хүргэлт анхны дуудсан газраа өөрчилсөн, хүргэлтийн ажилтан очиход байгаагүй буцсан тохиолдолд хүргэлтийн мөнгийг ахин төлөхийг анхаарна уу.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#F26522] mt-1 text-sm">●</span>
                <span>Хүргэлтийг зөвхөн насанд хүрсэн хүнд хүлээлгэн өгөхийг анхаарна уу.</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-sm text-slate-500 text-center">
          Сүүлд шинэчлэгдсэн: {new Date().toLocaleDateString('mn-MN')}
        </div>
      </div>
    </div>
  )
}
