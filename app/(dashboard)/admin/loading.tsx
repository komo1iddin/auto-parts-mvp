export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border bg-card" />
    </div>
  );
}
