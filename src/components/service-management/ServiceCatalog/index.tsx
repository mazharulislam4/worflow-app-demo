"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React, { useState } from "react";
import { ServiceCatalog as ServiceCatalogType, useCreateServiceRequestMutation, useExecuteWorkflowMutation, useGetServiceCatalogsQuery } from "../../../redux/features/serviceManagementSlice";
import { FormRenderer } from "../../form-builder";
import SearchAndFilters from "../SearchAndFilters";
import ServiceCard from "../ServiceCard";

interface ServiceRequestModalProps {
  service: ServiceCatalogType;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({ service, isOpen, onClose }) => {
  const [createServiceRequest] = useCreateServiceRequestMutation();
  const [executeWorkflow] = useExecuteWorkflowMutation();

  const handleSubmit = async (data: Record<string, string | boolean | number>) => {
    try {
      // Create the service request
      const serviceRequest = await createServiceRequest({
        catalog: service.id!,
        status: 'draft',
        assigned_type: 'auto',
        request_data: data,
        notes: data.notes as string || undefined,
      }).unwrap();
      
      // Execute the associated workflow if it exists
      if (service.wf_id) {
        try {
          await executeWorkflow({
            id: service.wf_id,
            input_data: {
              service_request_id: serviceRequest.id,
              request_data: data,
              service_catalog: service.name,
            }
          }).unwrap();
          
          alert("Service request submitted and workflow started successfully!");
        } catch (workflowError) {
          console.error("Failed to start workflow:", workflowError);
          alert("Service request submitted but workflow failed to start. Please contact support.");
        }
      } else {
        alert("Service request submitted successfully!");
      }
      onClose();
    } catch (error) {
      console.error("Failed to submit service request or start workflow:", error);
      alert("Failed to submit service request. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service.name}</DialogTitle>
          <DialogDescription>
            {service.description || "Please fill out the form below to request this service."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {service.form_json && 
           typeof service.form_json === 'object' && 
           service.form_json.fields && 
           Array.isArray(service.form_json.fields) && 
           service.form_json.fields.length > 0 ? (
            <FormRenderer 
              fields={service.form_json.fields}
              title="Service Request Form"
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              No form configured for this service. Please contact your administrator.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ServiceCatalog = () => {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalogType | null>(null);
  
  const { data: services, isLoading, error } = useGetServiceCatalogsQuery();

  const handleServiceClick = (service: ServiceCatalogType) => {
    setSelectedService(service);
    setRequestModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          Failed to load services. Please try again later.
        </div>
      </div>
    );
  }

  const servicesList = Array.isArray(services) ? services : [];

  return (
    <>
      <SearchAndFilters />
      {servicesList.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500">
            No services available. Contact your administrator to add services.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service) => (
            <ServiceCard 
              key={service.id} 
              data={{
                icon: "⚙️", // Default icon
                title: service.name,
                desc: service.description || "No description available",
                time: "Standard processing time",
                popularity: "Available"
              }}
              onClick={() => handleServiceClick(service)}
            />
          ))}
        </div>
      )}

      {/* Service Request Modal */}
      {requestModalOpen && selectedService && (
        <ServiceRequestModal 
          service={selectedService}
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
        />
      )}
    </>
  );
};

export default ServiceCatalog;
