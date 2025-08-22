"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import {
  ServiceCatalog,
  useCreateServiceCatalogMutation,
  useCreateServiceCategoryMutation,
  useGetServiceCategoriesQuery,
  useGetWorkflowsQuery
} from "../../redux/features/serviceManagementSlice";
import FormBuilder from "../form-builder/FormBuilder";
import { FormField } from "../form-builder/types";

interface Category {
  id?: number;
  name: string;
  description?: string;
}

interface Workflow {
  id?: number;
  name: string;
  description?: string;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose }) => {
  const [serviceData, setServiceData] = useState({
    name: "",
    description: "",
    sc_category: "",
    wf_id: "",
  });
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  // API hooks
  const { 
    data: categoriesData,
    refetch: refetchCategories
  } = useGetServiceCategoriesQuery();
  
  const { 
    data: workflowsData, 
  } = useGetWorkflowsQuery();

  const [createServiceCatalog] = useCreateServiceCatalogMutation();
  const [createServiceCategory] = useCreateServiceCategoryMutation();

  // Use real API data, no static fallbacks
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  const workflows: Workflow[] = Array.isArray(workflowsData) ? workflowsData.map(wf => ({
    id: wf.id,
    name: wf.name,
    description: wf.description
  })) : [];

  const handleSaveService = async () => {
    // Validate required fields - only name and workflow are required
    if (!serviceData.name.trim()) {
      alert("Please enter a service name");
      return;
    }
    if (!serviceData.wf_id) {
      alert("Please select a workflow");
      return;
    }

    try {
      const servicePayload: Partial<ServiceCatalog> = {
        name: serviceData.name,
        description: serviceData.description || "",
        wf_id: parseInt(serviceData.wf_id),
        form_json: formFields.length > 0 ? {
          fields: formFields,
          title: serviceData.name,
          version: "1.0"
        } : {}, // Pass empty object if no fields
        is_active: true
      };

      // Only include category if one is selected
      if (serviceData.sc_category) {
        servicePayload.sc_category = parseInt(serviceData.sc_category);
      }

      await createServiceCatalog(servicePayload as Omit<ServiceCatalog, "id" | "created_at" | "updated_at" | "sc_category_detail" | "wf_detail">).unwrap();
      alert("Service created successfully!");
      onClose();
      // Reset form
      setServiceData({
        name: "",
        description: "",
        sc_category: "",
        wf_id: "",
      });
      setFormFields([]);
    } catch (error) {
      console.error("Failed to create service:", error);
      alert("Failed to create service. Please check the form and try again.");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await createServiceCategory({
        name: newCategoryName,
        description: `${newCategoryName} services`
      }).unwrap();
      
      // Auto-select the newly created category
      if (newCategory && newCategory.id) {
        setServiceData({...serviceData, sc_category: newCategory.id.toString()});
      }
      
      setNewCategoryName("");
      setShowCreateCategory(false);
      
      // Refetch categories to update the list
      refetchCategories();
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[98vh] max-h-[98vh] flex flex-col">
        <DrawerHeader className="px-8 py-6 border-b w-full flex-shrink-0">
          <DrawerTitle className="text-3xl font-bold">Add New Service</DrawerTitle>
          <DrawerDescription className="text-lg">Create a new service with custom form and workflow</DrawerDescription>
        </DrawerHeader>
        
        <div className="space-y-8 w-full overflow-y-auto flex-1 px-8 py-8 min-h-0">
          {/* Service Details Section */}
          <Card className="w-full max-w-none">
            <CardHeader>
              <CardTitle className="text-2xl">Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Service Name *</Label>
                  <Input
                    id="service-name"
                    placeholder="Enter service name"
                    value={serviceData.name}
                    onChange={(e) => setServiceData({...serviceData, name: e.target.value})}
                    className="text-lg h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="space-y-2">
                    <Select 
                      value={serviceData.sc_category} 
                      onValueChange={(value) => setServiceData({...serviceData, sc_category: value})}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id || category.name} value={category.id?.toString() || ''}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {!showCreateCategory ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateCategory(true)}
                      >
                        Create New Category
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateCategory(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  placeholder="Describe what this service provides"
                  value={serviceData.description}
                  onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
                  rows={4}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Workflow</Label>
                <Select 
                  value={serviceData.wf_id} 
                  onValueChange={(value) => setServiceData({...serviceData, wf_id: value})}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id || workflow.name} value={workflow.id?.toString() || ''}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Form Builder and Preview Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Form Builder Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Custom Request Form</CardTitle>
                <p className="text-base text-gray-600">Build the form that users will fill when requesting this service</p>
              </CardHeader>
              <CardContent className="min-h-[500px]">
                <FormBuilder 
                  fields={formFields}
                  onFieldsChange={setFormFields}
                  showTitle={false}
                  className="p-0"
                />
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Form Preview</CardTitle>
                <p className="text-base text-gray-600">Preview how the form will look to users</p>
              </CardHeader>
              <CardContent className="min-h-[500px]">
                {formFields.length > 0 ? (
                  <div className="space-y-6">
                    {formFields.map((field) => (
                      <div key={field.id} className="border border-gray-200 p-6 rounded-lg">
                        <Label className="block text-base font-medium text-gray-700 mb-2">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {field.type === "textarea" ? (
                          <Textarea
                            placeholder={field.placeholder}
                            rows={4}
                            disabled
                            className="text-base"
                          />
                        ) : field.type === "select" ? (
                          <Select disabled>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, index) => (
                                <SelectItem key={index} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            disabled
                            className="text-base h-12"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <p className="text-lg">No fields added yet</p>
                    <p className="text-base">Add fields in the form builder to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DrawerFooter className="px-8 py-8 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-end gap-6 w-full max-w-none">
            <Button variant="outline" onClick={onClose} size="lg" className="px-12 py-3 text-lg">
              Cancel
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={!serviceData.name.trim() || !serviceData.wf_id}
              size="lg"
              className="px-12 py-3 text-lg"
            >
              Create Service
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddServiceModal;
