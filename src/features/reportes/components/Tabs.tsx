import { useState, ReactNode } from "react";

interface Tab {
  label: string;
  content: ReactNode;
}

export const Tabs = ({ tabs }: { tabs: Tab[] }) => {
  const [active, setActive] = useState(0);

  return (
    <div className="w-full">
      <div
        className="
          flex 
          overflow-x-auto 
          no-scrollbar 
          border-b 
          gap-2
          pb-1
        "
      >
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`
              px-4 py-2 
              text-sm sm:text-base 
              whitespace-nowrap
              transition-all
              rounded-t-lg
              
              ${
                active === i
                  ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs[active].content}</div>
    </div>
  );
};
