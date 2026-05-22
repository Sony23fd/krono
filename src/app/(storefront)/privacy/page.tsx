import { LockKeyhole, Database, Eye, Shield, UserCheck, Bell, Trash2 } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Нууцлалын бодлого - Билэг Супермаркет",
  description: "Билэг Супермаркет онлайн дэлгүүрийн нууцлалын бодлого",
}

export const dynamic = "force-dynamic"

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Database className="w-5 h-5" />,
      title: "1. Цуглуулах мэдээлэл",
      items: [
        "Бүртгүүлэх үед: Нэр, утасны дугаар, хаяг.",
        "Захиалга өгөхөд: Хүргэлтийн хаяг, холбоо барих мэдээлэл.",
        "Төлбөр хийхэд: QPay-ээр төлбөр хийсэн огноо, дүн (картын мэдээлэл манайд хадгалагдахгүй).",
        "Автоматаар: Сайтад нэвтрэх IP хаяг, хөтчийн төрөл, зочилсон хуудас, хандалтын хугацаа.",
      ]
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "2. Мэдээлэл ашиглах зорилго",
      items: [
        "Таны захиалгыг боловсруулж, хүргэлтийг зохион байгуулах.",
        "Бүртгэлтэй хэрэглэгчийг таньж баталгаажуулах.",
        "Захиалгын статус, урамшууллын мэдэгдэл илгээх.",
        "Сайтын ашиглалтын статистик гаргаж, үйлчилгээгээ сайжруулах.",
        "Хуулиар шаардлагатай тохиолдолд эрх бүхий байгууллагад мэдээлэл өгөх.",
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "3. Мэдээллийн хамгаалалт",
      items: [
        "Таны мэдээллийг зөвшөөрөлгүй гуравдагч этгээдэд дамжуулахгүй.",
        "Нууц үгийг шифрлэсэн хэлбэрээр хадгалдаг тул манай ажилтнууд ч харах боломжгүй.",
        "Сайтын холболтыг SSL шифрлэлтээр хамгаалдаг.",
        "Серверийн аюулгүй байдлыг тогтмол шинэчилж, гаднаас халдлагаас хамгаалдаг.",
        "Төлбөрийн мэдээллийг QPay-ийн аюулгүй системээр дамжуулан боловсруулдаг.",
      ]
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      title: "4. Хэрэглэгчийн эрх",
      items: [
        "Та өөрийн хувийн мэдээллийг хэдийд ч үзэх, засварлах боломжтой.",
        "Бүртгэлээ устгахыг хүсвэл бидэнтэй холбогдож устгуулах боломжтой.",
        "Маркетингийн мэдэгдэл хүлээн авахаас татгалзах боломжтой.",
        "Цуглуулсан мэдээллийнхээ жагсаалтыг авах эрхтэй.",
      ]
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: "5. Мэдэгдэл ба Cookie",
      items: [
        "Захиалгын төлөв өөрчлөгдөх үед автомат мэдэгдэл илгээнэ.",
        "Сайтад Cookie (жигнэмэг) ашиглан хэрэглэгчийн тохиргоо, сагс зэргийг хадгалдаг.",
        "Cookie-г хөтчийн тохиргооноос хаах боломжтой, гэхдээ зарим функц ажиллахгүй болж болно.",
        "Google Analytics зэрэг шинжилгээний хэрэгсэл ашиглаж болно.",
      ]
    },
    {
      icon: <Trash2 className="w-5 h-5" />,
      title: "6. Мэдээлэл хадгалах хугацаа",
      items: [
        "Хэрэглэгчийн бүртгэлийн мэдээллийг бүртгэл идэвхтэй байх хугацаанд хадгална.",
        "Захиалгын түүхийг нягтлан бодох бүртгэлийн шаардлагаар 2 жил хадгална.",
        "Бүртгэл устгагдсан тохиолдолд хувийн мэдээллийг 30 хоногийн дотор серверээс бүрэн устгана.",
      ]
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-4 pb-6 border-b">
          <div className="w-12 h-12 bg-[#F26522]/10 rounded-full flex items-center justify-center">
            <LockKeyhole className="w-6 h-6 text-[#F26522]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Нууцлалын бодлого</h1>
            <p className="text-sm text-slate-500 mt-1">Билэг Супермаркет — bileghurgelt.mn</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-10 leading-relaxed">
          Билэг Супермаркет нь хэрэглэгчдийн хувийн мэдээллийн нууцлал, аюулгүй байдлыг хамгаалахыг нэн тэргүүнд тавьж ажилладаг. Энэхүү Нууцлалын бодлого нь бидний цуглуулах, ашиглах, хамгаалах мэдээллийн талаар тайлбарладаг.
        </p>
        
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#F26522]/10 flex items-center justify-center text-[#F26522]">
                  {section.icon}
                </div>
                <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
              </div>
              <ul className="space-y-3 pl-11">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="text-[#F26522] mt-1.5 text-[8px] shrink-0">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            Нууцлалтай холбоотой асуулт байвал <a href="tel:80230077" className="text-[#F26522] font-semibold hover:underline">8023-0077</a> утсаар болон <a href="https://www.facebook.com/profile.php?id=61584428347590" target="_blank" rel="noopener noreferrer" className="text-[#F26522] font-semibold hover:underline">Facebook хуудас</a>-аар холбогдоно уу.
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t flex items-center justify-between text-xs text-slate-400">
          <span>Сүүлд шинэчлэгдсэн: 2026.05.22</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#F26522] transition-colors">Үйлчилгээний нөхцөл</Link>
            <Link href="/delivery-terms" className="hover:text-[#F26522] transition-colors">Хүргэлтийн нөхцөл</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
