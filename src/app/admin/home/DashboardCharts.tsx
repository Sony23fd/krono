"use client"

import { useState, useEffect } from "react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, Cell as RechartsCell
} from "recharts"

interface ChartData {
  revenueData: { date: string, amount: number }[];
  topProducts: { name: string, sales: number }[];
  viewsOverTime?: { date: string, count: number }[];
  categoryStats?: { name: string, value: number }[];
  topSearches?: { keyword: string, count: number }[];
}

const COLORS = [
  '#4e3dc7', // Deep Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Teal
  '#ec4899', // Rose
  '#f97316', // Orange
  '#14b8a6', // Cyan
];

export function DashboardCharts({ revenueData, topProducts, viewsOverTime = [], categoryStats = [], topSearches = [] }: ChartData) {
  const [mounted, setMounted] = useState(false)

  // Only render on the client to avoid SSR hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Provide clean skeleton placeholders with matching heights to prevent layout shifts
    return (
      <div className="space-y-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[380px] animate-pulse">
            <div className="h-6 w-48 bg-slate-100 rounded-lg"></div>
            <div className="flex-1 mt-4 bg-slate-50/50 rounded-xl"></div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[380px] animate-pulse">
            <div className="h-6 w-48 bg-slate-100 rounded-lg"></div>
            <div className="flex-1 mt-4 bg-slate-50/50 rounded-xl"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[430px] animate-pulse">
            <div className="h-6 w-48 bg-slate-100 rounded-lg"></div>
            <div className="flex-1 mt-4 bg-slate-50/50 rounded-xl"></div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[430px] animate-pulse">
            <div className="h-6 w-48 bg-slate-100 rounded-lg"></div>
            <div className="flex-1 mt-4 bg-slate-50/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Сүүлийн 7 хоногийн орлого
          </h3>
          <div style={{ height: "300px", minHeight: "300px" }} className="w-full flex-1 mt-4">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    width={50}
                    tickFormatter={(value) => `₮${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [`₮${value.toLocaleString()}`, 'Орлого']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#4e3dc7" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#4e3dc7", strokeWidth: 2, stroke: "#fff" }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Өгөгдөл байхгүй байна</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Вэбсайтын хандалт (Сүүлийн 7 хоног)
          </h3>
          <div style={{ height: "300px", minHeight: "300px" }} className="w-full flex-1 mt-4">
            {viewsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsOverTime} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={30} />
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value} хандалт`, 'Хандалт']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">Шинэ дата цуглуулж байна...</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Топ 10 борлуулалттай багцууд / бараа
          </h3>
          <div style={{ height: "350px", minHeight: "350px" }} className="w-full flex-1 mt-4">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value} ш`, 'Борлуулалт']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={20}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Өгөгдөл байхгүй байна</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Ангилалаарх борлуулалт (Бүх хугацаа)
          </h3>
          <div style={{ height: "350px", minHeight: "350px" }} className="w-full flex-1 mt-4">
            {categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryStats.map((entry, index) => (
                      <RechartsCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">Шүүлтүүрт тохирох дата алга...</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Searches */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          Хамгийн их хайгдсан үгс (Топ 20)
        </h3>
        <div className="flex flex-wrap gap-3">
          {topSearches && topSearches.length > 0 ? (
            topSearches.map((search, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full hover:border-indigo-300 transition-colors">
                <span className="font-semibold text-slate-700">{search.keyword}</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full font-bold">{search.count}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-400 font-medium py-4 text-sm w-full text-center">Хайлт хийгдээгүй байна...</div>
          )}
        </div>
      </div>
    </div>
  )
}
