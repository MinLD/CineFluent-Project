type Props = {
  data: {
    title: string;
    label: {
      id: string;
      name: string;
      icon: any;
    }[];
  }[];
};

export default function SidebarNavSkeleton({ data }: Props) {
  return (
    <div className="w-full animate-pulse">
      <div className="flex items-center gap-2 p-3 px-2 rounded mb-1">
        <div className="h-5 w-5 rounded bg-gray-700/50" />
        <div className="h-4 w-24 rounded bg-gray-700/50" />
      </div>

      <div className="mt-4 flex flex-col gap-2 p-2">
        {data.map((groupIndex) => (
          <div key={groupIndex.title} className="mb-2">
            <div className="mb-2 h-3 w-20 rounded bg-gray-700/30" />

            {groupIndex.label.map((item) => (
              <div
                key={item.id}
                className="flex w-full items-center gap-2 rounded p-2"
              >
                <div className="h-5 w-5 rounded bg-gray-700/50" />
                <div className={`h-4 rounded bg-gray-700/50 w-32`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
