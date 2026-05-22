import { MousePointerClick, CreditCard, Truck } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <MousePointerClick className="w-8 h-8 text-[#1B3561]" />,
      title: "1. Сонголтоо хийх",
      desc: "Та манай дэлгүүрт бэлэн байгаа чанартай бараануудаас хүссэнээ сонгон сагсандаа нэмнэ."
    },
    {
      icon: <CreditCard className="w-8 h-8 text-[#F26522]" />,
      title: "2. Захиалах",
      desc: "Сагсан дахь бараагаа шалгаад, төлбөрөө хялбархан төлж захиалгаа баталгаажуулна."
    },
    {
      icon: <Truck className="w-8 h-8 text-[#1B3561]" />,
      title: "3. Хүлээн авах",
      desc: "Таны захиалсан бараа хамгийн богино хугацаанд таны гарт найдвартай хүргэгдэх болно."
    }
  ];

  return (
    <div id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-red-100/30 blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B3561] tracking-tight">Хэрхэн ажилладаг вэ?</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-lg">Худалдан авалт хийх хамгийн хялбар 3 алхам</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative px-4">
          
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center group relative">
              {/* Connector line */}
              {i !== steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-slate-200 to-transparent -z-10"></div>
              )}
              
              <div className="bg-white rounded-3xl p-8 w-full border border-slate-100 shadow-xl shadow-slate-200/40 text-center hover:-translate-y-2 transition-transform duration-500 relative z-10">
                <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors duration-300 ${i === 1 ? 'bg-red-50 group-hover:bg-red-100' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

