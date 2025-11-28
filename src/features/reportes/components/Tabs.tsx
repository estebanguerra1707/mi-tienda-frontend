import { useState, ReactNode } from "react";

interface Tab {
  label: string;
  content: ReactNode;
}

export const Tabs = ({ tabs }: { tabs: Tab[] }) => {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Headers */}
      <div className="flex border-b mb-4">
        {tabs.map((t, i) => (
          <button
            key={i}
            className={`px-4 py-2 font-medium border-b-2 
              ${active === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}
            `}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>{tabs[active].content}</div>
    </div>
  );
};
