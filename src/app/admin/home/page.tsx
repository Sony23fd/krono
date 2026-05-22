import { db } from "@/lib/db"
import { Package, ShoppingCart, DollarSign, AlertCircle } from "lucide-react"
import { DashboardCharts } from "./DashboardCharts"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;

  const now = new Date();
  
  let totalRevenue = 0;
  let successfulOrdersCount = 0;
  let pendingOrdersCount = 0;
  let activeProductsCount = 0;
  let revenueData: { date: string, amount: number }[] = [];
  let topProducts: { name: string, sales: number }[] = [];

  try {
    const validOrderFilter: any = {
      orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
    };
    
    if (days > 0) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      validOrderFilter.createdAt = { gte: cutoffDate };
    }

    // Parallel fetch all data
    const [
      revenueResult,
      confirmedCount,
      pendingCount,
      activeCount,
    ] = await Promise.all([
      db.order.aggregate({ where: validOrderFilter, _sum: { totalAmount: true } }),
      db.order.count({ where: validOrderFilter }),
      db.order.count({ where: { orderStatus: "PENDING" } }),
      db.product.count({ where: { status: "ACTIVE" } }),
    ]);

    totalRevenue = Number(revenueResult._sum?.totalAmount || 0);
    successfulOrdersCount = confirmedCount;
    pendingOrdersCount = pendingCount;
    activeProductsCount = activeCount;

    // Chart 1: Revenue last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await db.order.findMany({
      where: { 
        createdAt: { gte: sevenDaysAgo },
        orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      select: { createdAt: true, totalAmount: true }
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      revenueByDate[dateStr] = 0;
    }
    
    recentOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (revenueByDate[dateStr] !== undefined) {
        revenueByDate[dateStr] += Number(order.totalAmount || 0);
      }
    });

    revenueData = Object.keys(revenueByDate).map(date => ({
      date: date.substring(5), // MM-DD
      amount: revenueByDate[date]
    }));

    // Chart 2: Top selling products (by OrderItem)
    const topItems = await db.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { orderStatus: { notIn: ["CANCELLED", "REFUNDED"] } },
        ...(days > 0 && { order: { createdAt: { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) } } }),
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    if (topItems.length > 0) {
      const productIds = topItems.map(i => i.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });

      topProducts = topItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        const name = product?.name || "Нэргүй";
        return {
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          sales: item._sum.quantity || 0,
        };
      });
    }
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
  }

  return (
    <div className="space-y-6">
      {pendingOrdersCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 rounded-2xl flex items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Хүлээгдэж буй захиалга</h3>
              <p className="text-amber-700 text-sm mt-0.5"><strong>{pendingOrdersCount}</strong> ширхэг захиалга төлбөр хүлээж байна.</p>
            </div>
          </div>
          <Link href="/admin/orders" className="text-xs font-bold bg-white text-amber-700 border border-amber-200 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap">
            Шалгах →
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Хянах самбар</h1>
          <p className="text-slate-500 mt-1 text-sm">Дэлгүүрийн үйл ажиллагааны нэгдсэн харагдац.</p>
        </div>
        <DateRangeFilter days={days} basePath="/admin/home" />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 group hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Нийт Орлого</span>
            <div className="p-2 bg-[#F26522]/10 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4 text-[#F26522]" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">₮{totalRevenue.toLocaleString()}</p>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#F26522]/5 rounded-full blur-2xl"></div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 group hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Захиалга</span>
            <div className="p-2 bg-[#22c55e]/10 rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-4 w-4 text-[#22c55e]" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{successfulOrdersCount.toLocaleString()}</p>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#22c55e]/5 rounded-full blur-2xl"></div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 group hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Хүлээгдэж буй</span>
            <div className="p-2 bg-[#fb8500]/10 rounded-xl group-hover:scale-110 transition-transform">
              <AlertCircle className="h-4 w-4 text-[#fb8500]" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{pendingOrdersCount}</p>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#fb8500]/5 rounded-full blur-2xl"></div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 group hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Идэвхтэй бараа</span>
            <div className="p-2 bg-[#001f3f]/10 rounded-xl group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4 text-[#001f3f]" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{activeProductsCount}</p>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#001f3f]/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      <DashboardCharts 
        revenueData={revenueData} 
        topProducts={topProducts} 
        viewsOverTime={[]} 
        categoryStats={[]}
      />
    </div>
  )
}
