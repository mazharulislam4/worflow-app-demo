"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Settings, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { FieldType, FormField } from "./types";

interface FieldEditorProps {
  field?: FormField;
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, isOpen, onClose, onSave }) => {
  const [fieldData, setFieldData] = useState<FormField>(
    field || {
      id: "",
      name: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
    }
  );

  const [options, setOptions] = useState<string[]>(field?.options || []);

  React.useEffect(() => {
    if (isOpen) {
      if (field) {
        // Editing existing field
        setFieldData(field);
        setOptions(field.options || []);
      } else {
        // Creating new field - generate fresh ID and reset everything
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const uuid = crypto.randomUUID();
        const newFieldData: FormField = {
          id: `field_${timestamp}_${randomStr}_${uuid}`,
          name: "",
          type: "text" as FieldType,
          label: "",
          placeholder: "",
          required: false,
          options: [],
        };
        console.log("Creating new field with ID:", newFieldData.id);
        setFieldData(newFieldData);
        setOptions([]);
      }
    }
  }, [field, isOpen]);

  const fieldTypes: { key: FieldType; label: string }[] = [
    { key: "text", label: "Text Input" },
    { key: "email", label: "Email" },
    { key: "number", label: "Number" },
    { key: "textarea", label: "Text Area" },
    { key: "select", label: "Select Dropdown" },
    { key: "radio", label: "Radio Buttons" },
    { key: "checkbox", label: "Checkbox" },
  ];

  const handleSave = () => {
    if (!fieldData.label.trim()) return;
    if (!fieldData.name.trim()) return;

    const updatedField = {
      ...fieldData,
      options: ["select", "radio"].includes(fieldData.type) ? options : [],
    };

    onSave(updatedField);
    onClose();
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {field ? "Edit" : "Add"} Field
          </DialogTitle>
          <DialogDescription>
            Configure the field properties below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label</Label>
            <Input
              id="field-label"
              value={fieldData.label}
              onChange={(e) => setFieldData({...fieldData, label: e.target.value})}
              placeholder="Enter field label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name (Database Field)</Label>
            <Input
              id="field-name"
              value={fieldData.name}
              onChange={(e) => setFieldData({...fieldData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
              placeholder="e.g. email, phone_number, full_name"
            />
            <p className="text-xs text-gray-500">Used to save data in database. Only lowercase letters, numbers, and underscores allowed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={fieldData.placeholder}
              onChange={(e) => setFieldData({...fieldData, placeholder: e.target.value})}
              placeholder="Enter placeholder text"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select value={fieldData.type} onValueChange={(value) => setFieldData({...fieldData, type: value as FieldType})}>
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={fieldData.required}
              onCheckedChange={(checked) => setFieldData({...fieldData, required: !!checked})}
            />
            <Label htmlFor="field-required">Required field</Label>
          </div>

          {["select", "radio"].includes(fieldData.type) && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addOption}
                  size="sm"
                >
                  <Plus size={16} className="mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!fieldData.label.trim()}
          >
            {field ? "Update" : "Add"} Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface FormBuilderProps {
  fields?: FormField[];
  onFieldsChange?: (fields: FormField[]) => void;
  title?: string;
  showTitle?: boolean;
  className?: string;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ 
  fields: propFields = [], 
  onFieldsChange, 
  title = "My Custom Form",
  showTitle = true,
  className = "p-6"
}) => {
  const [editingField, setEditingField] = useState<FormField | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Use propFields directly instead of local state to avoid sync issues
  const fields = propFields;

  const handleAddField = () => {
    setEditingField(undefined);
    setIsEditorOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleSaveField = (field: FormField) => {
    let updatedFields;
    if (editingField) {
      updatedFields = fields.map((f) => (f.id === field.id ? field : f));
    } else {
      updatedFields = [...fields, field];
    }
    onFieldsChange?.(updatedFields);
    handleCloseEditor();
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingField(undefined);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter((f) => f.id !== fieldId);
    onFieldsChange?.(updatedFields);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {showTitle && (
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <Button onClick={handleAddField} size="sm">
              <Plus size={16} className="mr-2" />
              Add New Field
            </Button>
          </div>
        )}

        {!showTitle && (
          <div className="flex justify-end">
            <Button onClick={handleAddField} size="sm">
              <Plus size={16} className="mr-2" />
              Add New Field
            </Button>
          </div>
        )}

        <Card className="min-h-[400px]">
          <CardContent className="p-8">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Settings size={48} className="text-gray-400" />
                <h3 className="text-lg text-gray-500">No fields added yet</h3>
                <p className="text-sm text-gray-400">
                  Click &quot;Add New Field&quot; to start building your form
                </p>
                <Button onClick={handleAddField} variant="outline">
                  Add Your First Field
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={`${field.id}-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{field.label}</h4>
                          <p className="text-sm text-gray-600">
                            Type: {field.type} {field.required && "(Required)"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditField(field)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FieldEditor
        field={editingField}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveField}
      />
    </div>
  );
};

export default FormBuilder;
