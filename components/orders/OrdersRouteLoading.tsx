export function OrdersRouteLoading({ title = "Buyurtma yuklanmoqda..." }: { title?: string }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-6 w-56 animate-pulse rounded bg-gray-100" />
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                <div className="h-6 w-12 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
            <div className="flex gap-2 rounded-lg border border-gray-100 bg-gray-50 p-1">
              <div className="h-8 w-24 animate-pulse rounded-md bg-white" />
              <div className="h-8 w-24 animate-pulse rounded-md bg-white" />
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white px-5 py-3">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-28 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-gray-100" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-4">
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

export function OrdersListLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-md bg-gray-100" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="space-y-3 border-b border-gray-100 p-4">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-8 w-24 animate-pulse rounded-sm bg-gray-100" />
            ))}
          </div>
          <div className="h-8 w-full max-w-sm animate-pulse rounded-md bg-gray-100" />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px] divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-10 gap-4 px-5 py-3">
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-5 animate-pulse rounded-full bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="h-8 animate-pulse rounded-md bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
