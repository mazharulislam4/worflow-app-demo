import React from "react";

interface PropsType {
  data: string[];
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

const Tabs = ({ data, activeTab, setActiveTab }: PropsType) => {
  return (
    <nav className="mb-6 flex gap-6 border-b border-gray-100">
      {data.map((t) => (
        <button
          key={t}
          onClick={() => setActiveTab(t)}
          className={`pb-2 border-b-2 ${
            activeTab === t
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          } font-medium`}
        >
          {t}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;
