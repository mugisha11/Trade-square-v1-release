export function OpportunityCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading opportunities">
      {Array.from({ length: count }).map((_, idx) => (
        <article
          key={idx}
          className="bg-white dark:bg-[#16181C] rounded-xl border border-[#E4E6EB]/90 dark:border-[#2F3336] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden"
        >
          {/* Header Row matching OpportunityCard */}
          <div className="px-4 sm:px-5 pt-4 pb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full apple-skeleton shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-40 sm:w-48 rounded-md apple-skeleton" />
                  <div className="h-4 w-20 rounded-md apple-skeleton" />
                </div>
                <div className="h-3 w-52 sm:w-64 rounded-md apple-skeleton" />
              </div>
            </div>
            <div className="h-8 w-20 rounded-full apple-skeleton shrink-0" />
          </div>

          {/* Content Block */}
          <div className="px-4 sm:px-5 pb-4 space-y-2.5">
            <div className="h-5 w-3/4 rounded-md apple-skeleton" />
            <div className="space-y-2 pt-0.5">
              <div className="h-3.5 w-full rounded-md apple-skeleton" />
              <div className="h-3.5 w-5/6 rounded-md apple-skeleton" />
            </div>

            {/* Specs Block */}
            <div className="mt-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#000000] border border-[#E4E6EB]/80 dark:border-[#2F3336] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((col) => (
                <div key={col} className="space-y-1.5">
                  <div className="h-3 w-20 rounded-md apple-skeleton" />
                  <div className="h-4 w-28 rounded-md apple-skeleton" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 3-Button Action Strip */}
          <div className="px-3 py-2.5 border-t border-[#E4E6EB] dark:border-[#2F3336] grid grid-cols-3 gap-2">
            <div className="h-7 rounded-lg apple-skeleton" />
            <div className="h-7 rounded-lg apple-skeleton" />
            <div className="h-7 rounded-lg apple-skeleton" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function RecommendedBusinessSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3.5" aria-busy="true" aria-label="Loading recommended businesses">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="pb-3.5 last:pb-0 border-b last:border-b-0 border-[#F0F2F5] dark:border-[#2F3336]"
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full apple-skeleton shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-4 w-36 rounded-md apple-skeleton" />
                <div className="h-3 w-44 rounded-md apple-skeleton" />
              </div>
            </div>
            <div className="h-8 w-20 rounded-lg apple-skeleton shrink-0" />
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full rounded-md apple-skeleton" />
            <div className="h-3 w-3/4 rounded-md apple-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverBusinessSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading businesses">
      {Array.from({ length: count }).map((_, idx) => (
        <article
          key={idx}
          className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg apple-skeleton shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-44 rounded-md apple-skeleton" />
              <div className="h-3 w-40 rounded-md apple-skeleton" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-md apple-skeleton" />
            <div className="h-3 w-4/5 rounded-md apple-skeleton" />
          </div>
          <div className="h-3 w-3/5 rounded-md apple-skeleton" />
          <div className="h-8 w-36 rounded-lg apple-skeleton" />
        </article>
      ))}
    </div>
  );
}

export function RegionalInsightsSkeleton() {
  return (
    <div className="mt-3.5 space-y-4" aria-busy="true" aria-label="Loading regional insights">
      <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-lg bg-[#F5F5F7] dark:bg-[#000000] dark:border dark:border-[#2F3336]">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-md apple-skeleton" />
          <div className="h-6 w-12 rounded-md apple-skeleton" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-md apple-skeleton" />
          <div className="h-6 w-12 rounded-md apple-skeleton" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1].map((idx) => (
          <div key={idx} className="pb-3 last:pb-0 border-b last:border-b-0 border-[#F0F2F5] dark:border-[#2F3336] space-y-2">
            <div className="h-3 w-28 rounded-md apple-skeleton" />
            <div className="h-4 w-48 rounded-md apple-skeleton" />
            <div className="h-3 w-full rounded-md apple-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
