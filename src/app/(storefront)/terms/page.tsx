import { ShieldAlert, ShoppingCart, Truck, CreditCard, RotateCcw, AlertTriangle, UserCheck } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Үйлчилгээний нөхцөл - Билэг Супермаркет",
  description: "Билэг Супермаркет онлайн дэлгүүрийн үйлчилгээний нөхцөл",
}

export const dynamic = "force-dynamic"

export default function TermsPage() {
  const sections = [
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "1. Ерөнхий нөхцөл",
      items: [
        "Билэг Супермаркет (цаашид \"бид\", \"манай\") нь bileghurgelt.mn вэбсайтаар дамжуулан онлайн худалдааны үйлчилгээ үзүүлнэ.",
        "Та манай сайтад бүртгүүлж, захиалга өгснөөр эдгээр нөхцөлийг хүлээн зөвшөөрсөнд тооцогдоно.",
        "Манай бараа бүтээгдэхүүний үнэ, нөөц, хямдралын мэдээлэл нь өөрчлөгдөх боломжтой бөгөөд захиалга баталгаажсан үеийн үнээр тооцогдоно.",
        "Захиалга өгөхдөө үнэн зөв мэдээлэл оруулах үүрэгтэй. Буруу мэдээлэл оруулсанаас үүдэх хохирлыг хэрэглэгч хариуцна.",
        "18 нас хүрээгүй хүмүүс насанд хүрсэн хүний зөвшөөрөлгүйгээр захиалга үүсгэхийг хориглоно.",
      ]
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: "2. Захиалга ба төлбөр",
      items: [
        "Захиалга нь төлбөр амжилттай хийгдсэний дараа баталгаажна.",
        "Төлбөрийг QPay болон бэлнээр хийх боломжтой.",
        "Төлбөр төлөгдөөгүй захиалга 30 минутын дараа автоматаар цуцлагдана.",
        "Захиалгын дүн 50,000₮-с дээш бол хүргэлтийн хөнгөлөлт авах боломжтой (урамшуулал явагдаж буй тохиолдолд).",
        "Барааны үнэ буруу тохиолдолд бид захиалгыг цуцлах эрхтэй.",
      ]
    },
    {
      icon: <Truck className="w-5 h-5" />,
      title: "3. Хүргэлтийн нөхцөл",
      items: [
        "Хүргэлт нь Дархан хот дотор заагдсан бүсэд үйлчилнэ.",
        "Хүргэлтийн цаг: Өдөр бүр 09:00 - 22:00.",
        "Хүргэлтийн төлбөрийг хэрэглэгч тал бүрэн хариуцна.",
        "Хүргэлт анхны дуудсан газраа өөрчилсөн, хүргэлтийн ажилтан очиход байгаагүй буцсан тохиолдолд хүргэлтийн мөнгийг ахин төлнө.",
        "Хүргэлтийг зөвхөн насанд хүрсэн хүнд хүлээлгэн өгнө.",
        "Хүргэлтийн хугацаа захиалга баталгаажсанаас хойш 24 цагийн дотор байна.",
      ]
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      title: "4. Буцаалт ба солилт",
      items: [
        "Бараа хүлээн авсан даруй шалгаж, гэмтэлтэй, буруу бараа илэрсэн тохиолдолд 24 цагийн дотор мэдэгдэнэ үү.",
        "Хоол, хүнс, ариун цэврийн бүтээгдэхүүн зэрэг эрүүл мэндийн шалтгааны улмаас буцаалт хийгдэхгүй.",
        "Буцаалт хийгдэх тохиолдолд барааны анхны төлөв, баглаа боодол хадгалагдсан байх шаардлагатай.",
        "Буцаалт баталгаажсан тохиолдолд мөнгийг 3-5 ажлын өдөрт буцаана.",
      ]
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "5. Хариуцлагын хязгаар",
      items: [
        "Бид техникийн саатал, давагдашгүй хүчин зүйлийн улмаас үүссэн хохирлыг хариуцахгүй.",
        "Сайт дээрх барааны зурган мэдээлэл бодит бүтээгдэхүүнээс бага зэрэг ялгаатай байж болно.",
        "Гуравдагч этгээдийн сайт руу хийсэн холбоосын агуулгыг бид хариуцахгүй.",
        "Системийн шинэчлэл, засвар үйлчилгээний улмаас үйлчилгээ түр зогсох боломжтой.",
      ]
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      title: "6. Хэрэглэгчийн үүрэг",
      items: [
        "Нэвтрэх нууц үг болон бүртгэлийн мэдээллийг найдвартай хадгална.",
        "Манай сайтыг хууль бус зорилгоор ашиглахгүй.",
        "Бусад хэрэглэгчийн мэдээллийг олж авах, хулгайлах зэрэг үйлдэл хийхгүй.",
        "Асуудал гарсан тохиолдолд 8023-0077 утсаар холбогдоно уу.",
      ]
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-4 pb-6 border-b">
          <div className="w-12 h-12 bg-[#F26522]/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#F26522]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Үйлчилгээний нөхцөл</h1>
            <p className="text-sm text-slate-500 mt-1">Билэг Супермаркет — bileghurgelt.mn</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-10 leading-relaxed">
          Энэхүү Үйлчилгээний нөхцөл нь Билэг Супермаркетийн bileghurgelt.mn вэбсайтаар дамжуулан онлайн худалдаа хийхэд мөрдөгдөх дүрэм, журмыг тодорхойлно. Та манай үйлчилгээг ашигласнаар доорх нөхцөлүүдийг хүлээн зөвшөөрсөнд тооцогдоно.
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
            Асуулт, санал хүсэлтээ <a href="tel:80230077" className="text-[#F26522] font-semibold hover:underline">8023-0077</a> утсаар болон <a href="https://www.facebook.com/profile.php?id=61584428347590" target="_blank" rel="noopener noreferrer" className="text-[#F26522] font-semibold hover:underline">Facebook хуудас</a>-аар илгээнэ үү.
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t flex items-center justify-between text-xs text-slate-400">
          <span>Сүүлд шинэчлэгдсэн: 2026.05.22</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#F26522] transition-colors">Нууцлалын бодлого</Link>
            <Link href="/delivery-terms" className="hover:text-[#F26522] transition-colors">Хүргэлтийн нөхцөл</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
