"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddServiceModal from "./AddServiceModal";
import Tabs from "./header/Tabs";
import Management from "./Management";
import Requests from "./Requests";
import ServiceCatalog from "./ServiceCatalog";

const ServiceManagementComponents = () => {
  const [activeTab, setActiveTab] = useState("Service Catalog");
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">IT Service Management</h1>
          <p className="text-gray-500">
            Request services and track your IT requests
          </p>
        </div>
        <button 
          onClick={() => setIsAddServiceOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      <Tabs
        data={["Service Catalog", "My Requests", "Service Management"]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {activeTab === "Service Catalog" && <ServiceCatalog />}
      {activeTab === "My Requests" && <Requests />}
      {activeTab === "Service Management" && <Management />}

      <AddServiceModal 
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
      />
    </div>
  );
};

export default ServiceManagementComponents;
