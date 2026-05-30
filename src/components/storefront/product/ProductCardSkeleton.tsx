export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-2.5 md:p-3.5 flex flex-col border border-slate-100 shadow-sm h-full animate-pulse">
      {/* Image Placeholder */}
      <div className="bg-slate-200 rounded-lg aspect-square mb-2.5 md:mb-3 relative w-full"></div>

      <div className="flex-1 flex flex-col gap-1 md:gap-1.5">
        {/* Title Placeholder */}
        <div className="h-4 md:h-5 bg-slate-200 rounded-md w-3/4 mb-1"></div>
        <div className="h-4 md:h-5 bg-slate-200 rounded-md w-1/2"></div>

        <div className="mt-auto pt-1 md:pt-2">
          {/* Price Placeholder */}
          <div className="mb-2 md:mb-2.5">
            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-1/2"></div>
            <div className="h-3 bg-slate-200 rounded-md w-1/3 mt-1.5"></div>
          </div>

          {/* Button Placeholder */}
          <div className="h-10 md:h-11 bg-slate-200 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  )
}
