export default function PageContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
      <h1 className="mt-4 text-xl font-semibold sm:text-2xl">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}
