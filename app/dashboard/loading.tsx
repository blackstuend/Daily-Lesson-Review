import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="space-y-6 rounded-lg border">
        <div className="space-y-3 border-b p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
