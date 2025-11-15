export function MathlerGameSkeleton() {
  return (
    <div className="w-full max-w-sm space-y-6" aria-label="Loading Mathler game">
      {/* Header Skeleton */}
      <div className="text-center">
        <div className="h-10 w-32 bg-muted rounded-md mx-auto mb-2 animate-pulse" />
        <div className="h-6 w-64 bg-muted rounded-md mx-auto animate-pulse" />
      </div>

      {/* Game Board Skeleton - 6 rows */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-1 justify-center">
            {[...Array(9)].map((_, j) => (
              <div
                key={j}
                className="flex-1 aspect-square bg-muted rounded-md animate-pulse"
                style={{ animationDelay: `${j * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Keypad Skeleton */}
      <div className="space-y-3">
        {/* Numbers Grid - 10 numbers (0-9) */}
        <div className="grid grid-cols-5 gap-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))}
        </div>
        {/* Operators - 4 operators */}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))}
        </div>
        {/* Action Buttons - Back and Submit */}
        <div className="grid grid-cols-2 gap-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
