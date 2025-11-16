export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 w-full bg-gradient-to-br from-gray-200 to-gray-300" />
      
      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded-lg mb-3 w-3/4" />
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
        
        {/* Price and button skeleton */}
        <div className="flex items-center justify-between mt-4">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </div>
  )
}

export function FileProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="h-48 w-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4" />
      
      {/* Title skeleton */}
      <div className="h-5 bg-gray-200 rounded-lg mb-2 w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      
      {/* Tags skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      
      {/* Price and button skeleton */}
      <div className="flex items-center justify-between mt-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  )
}

