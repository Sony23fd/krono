import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export async function HeroSection() {
  let showText = true;
  let carouselImages: string[] = [];

  try {
    const settings = await db.shopSettings.findMany({
      where: {
        key: { in: ["hero_text_visible", "hero_carousel_images"] }
      }
    });

    const config = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    if (config["hero_text_visible"] === "false") {
      showText = false;
    }
    if (config["hero_carousel_images"]) {
      carouselImages = JSON.parse(config["hero_carousel_images"]);
    }
  } catch (e) {
    console.error("Failed to load hero settings", e);
  }

  return (
    <div className="relative overflow-hidden min-h-[400px] md:min-h-[500px] flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[80%] h-full bg-[#F26522]/5 rounded-bl-[100%]"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#F26522]/5 rounded-tr-[100%]"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-10">
        
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left pt-10 md:pt-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 border border-red-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse"></span>
            <span className="text-sm font-bold text-[#F26522]">Өдөр бүр шинэ хямдрал</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1B3561] tracking-tight leading-tight max-w-2xl">
            Таны өдөр тутмын <br className="hidden sm:block" /> 
            <span className="text-[#F26522]">
              супермаркет
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mx-auto md:mx-0">
            Хамгийн шинэ ногоо, жимс, өргөн хэрэглээний бараа бүтээгдэхүүнийг хамгийн хямд үнээр танд санал болгож байна.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <Link href="/deals" className="px-8 py-4 bg-[#F26522] hover:bg-orange-600 text-white font-bold rounded-full shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center text-lg">
              Хямдрал үзэх
            </Link>
            <Link href="/categories" className="px-8 py-4 bg-white hover:bg-slate-50 text-[#1B3561] font-bold rounded-full shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center text-lg">
              Бүх ангилал
            </Link>
          </div>
        </div>

        {/* Mascot Image (Right side on desktop, bottom on mobile) */}
        <div className="flex-1 flex justify-center md:justify-end relative h-[300px] md:h-[450px] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 md:hidden bottom-0 h-20"></div>
          <Image
            src="/1.png" // The Rabbit Mascot
            alt="Bileg Supermarket Mascot"
            fill
            className="object-contain object-center md:object-right-bottom drop-shadow-2xl z-0"
            priority
          />
        </div>

      </div>
    </div>
  )
}
