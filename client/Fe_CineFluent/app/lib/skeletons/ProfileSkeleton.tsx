// app/lib/skeletons/ProfileSkeleton.tsx

export function SidebarSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center animate-pulse space-y-4">
      {/* Avatar Circle */}
      <div className="mx-auto w-32 h-32 rounded-full bg-gray-200" />

      {/* Name & Bio */}
      <div className="h-6 w-3/4 bg-gray-200 rounded mx-auto" />
      <div className="h-4 w-5/6 bg-gray-100 rounded mx-auto" />

      {/* Progress Bar */}
      <div className="pt-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-8 bg-gray-200 rounded" />
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5" />
      </div>

      {/* Toggle */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-6 w-10 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] animate-pulse">
      {/* Tabs Header */}
      <div className="border-b border-gray-100 p-2 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-gray-100 rounded-xl" />
        ))}
      </div>

      {/* Tabs Content */}
      <div className="p-8 space-y-6">
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
          <div className="h-10 w-full bg-gray-100 rounded-xl" />
        </div>
        <div className="h-32 w-full bg-gray-50 rounded-xl mt-4" />
      </div>
    </div>
  );
}

export function SkillsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex justify-between p-5 border border-gray-100 rounded-xl bg-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-24 bg-gray-200 rounded-lg" />
            <div className="h-9 w-24 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
