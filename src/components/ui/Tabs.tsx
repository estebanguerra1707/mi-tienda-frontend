interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="border-b mb-4 flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            active === t.id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-blue-500"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
