"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"

const branches = [
  {
    id: 1,
    name: "Салбар 1 (380)",
    address: "Шинэ Дархан 380",
    query: "49.4614167,105.9495556",
    link: "https://www.google.mn/maps/place/49%C2%B027'41.1%22N+105%C2%B056'58.4%22E/@49.4614167,105.9495556,706m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d49.4614167!4d105.9495556?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D"
  },
  {
    id: 2,
    name: "Салбар 2 (Парк таун)",
    address: "Шинэ Дархан Парк таун 3 хотхон",
    query: "49.4610667,105.955746",
    link: "https://maps.app.goo.gl/bcpAhTWCQX4mchge6"
  }
]

export function FooterMap() {
  const [activeBranch, setActiveBranch] = useState(branches[0])

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4 shrink-0">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setActiveBranch(branch)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all border ${
              activeBranch.id === branch.id
                ? "bg-[#F26522] text-white border-[#F26522] shadow-[0_0_15px_rgba(242,101,34,0.3)]"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            {branch.name}
          </button>
        ))}
      </div>
      
      <div className="rounded-2xl overflow-hidden shadow-sm flex-1 relative group w-full min-h-[300px]">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(activeBranch.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
        ></iframe>
        
        {/* Overlay link to open in Google Maps app/new tab */}
        <a 
          href={activeBranch.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <div className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <MapPin className="w-4 h-4 text-[#F26522]" />
            Томруулах
          </div>
        </a>
      </div>
    </div>
  )
}
