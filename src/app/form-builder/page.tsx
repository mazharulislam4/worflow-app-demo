"use client";

import { useState } from "react";
import { FormRenderer } from "../../components/form-builder";
import FormBuilder from "../../components/form-builder/FormBuilder";
import { FormField } from "../../components/form-builder/types";

export default function FormBuilderPage() {
  const [formFields, setFormFields] = useState<FormField[]>([]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Form Builder Demo
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Create custom forms with an intuitive drag-and-drop interface
            </p>
          </div>

          {/* Form Builder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <FormBuilder 
              fields={formFields}
              onFieldsChange={setFormFields}
            />
          </div>

          {/* Form Preview */}
          {formFields.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Form Preview</h2>
              <FormRenderer 
                fields={formFields} 
                title="Dynamic Form"
                onSubmit={(data: Record<string, string | boolean | number>) => {
                  console.log("Form submitted:", data);
                  alert("Form submitted! Check console for data.");
                }}
              />
            </div>
          )}
        </div>
    </div>
  );
}
