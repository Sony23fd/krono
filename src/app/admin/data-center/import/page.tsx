export default function ImportPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Өгөгдөл импорт</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <p className="text-amber-800 font-medium">
          Импорт хэсэг шинэ schema-д тохируулж дахин хөгжүүлэгдэж байна.
        </p>
        <p className="text-sm text-amber-600 mt-2">
          Барааны импортод /api/admin/products/bulk-upload ашиглана уу.
        </p>
      </div>
    </div>
  )
}
