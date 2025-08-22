import React from "react";

const ServiceManagementHeader = () => {
  return (
    <header className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-semibold">IT Service Management</h1>
        <p className="text-gray-500">
          Request services and track your IT requests
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-gray-600">👤 John Admin (Admin)</div>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          + Add Service
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Request
        </button>
      </div>
    </header>
  );
};

export default ServiceManagementHeader;
