import React from "react";
import { Search } from "lucide-react";

const SearchAndFilters = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative flex-1 min-w-[250px]">
        <input
          type="text"
          placeholder="Search services..."
          className="w-full px-4 py-2 border rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
      </div>
      <select className="px-4 py-2 border rounded-md focus:outline-none">
        <option>All Services (4)</option>
        <option>Laptop</option>
        <option>Software</option>
        <option>Access</option>
      </select>
    </div>
  );
};

export default SearchAndFilters;
