"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { FormField } from "./types";

type FormData = Record<string, string | boolean | number>;

interface FormRendererProps {
  fields: FormField[];
  title?: string;
  onSubmit: (data: FormData) => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  fields,
  title = "Dynamic Form",
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: FormField, value: string | boolean | number) => {
    const key = field.name || field.id; // Use field name if available, fallback to ID
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const key = field.name || field.id;
      if (field.required && (!formData[key] || formData[key] === "")) {
        newErrors[key] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField, index: number) => {
    const key = field.name || field.id;
    const value = formData[key] || "";
    const hasError = !!errors[key];
    const uniqueKey = `${field.id}-${index}`; // Use field ID + index for unique keys

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <div key={uniqueKey} className="space-y-2">
            <Label htmlFor={uniqueKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={uniqueKey}
              type={field.type}
              placeholder={field.placeholder}
              value={value as string}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-red-500 text-sm">{errors[key]}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={uniqueKey} className="space-y-2">
            <Label htmlFor={uniqueKey}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={uniqueKey}
              placeholder={field.placeholder}
              value={value as string}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={4}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && <p className="text-red-500 text-sm">{errors[key]}</p>}
          </div>
        );

      case "select":
        return (
          <div key={uniqueKey} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value as string} onValueChange={(newValue) => handleInputChange(field, newValue)}>
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, optionIndex) => (
                  <SelectItem key={`${uniqueKey}-option-${optionIndex}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-red-500 text-sm">{errors[key]}</p>}
          </div>
        );

      case "radio":
        return (
          <div key={uniqueKey} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value as string}
              onValueChange={(newValue) => handleInputChange(field, newValue)}
              className={hasError ? "border-red-500 rounded p-2" : ""}
            >
              <div className="space-y-2">
                {field.options?.map((option, optionIndex) => (
                  <div key={`${uniqueKey}-radio-${optionIndex}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${uniqueKey}-radio-${optionIndex}`} />
                    <Label htmlFor={`${uniqueKey}-radio-${optionIndex}`}>{option}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {hasError && <p className="text-red-500 text-sm">{errors[key]}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={uniqueKey} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={uniqueKey}
                checked={!!value}
                onCheckedChange={(checked) => handleInputChange(field, checked)}
              />
              <Label htmlFor={uniqueKey}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {hasError && <p className="text-red-500 text-sm">{errors[key]}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {title && (
        <h2 className="text-2xl font-bold text-center">
          {title}
        </h2>
      )}
      
      {fields.map((field, index) => renderField(field, index))}
      
      {fields.length > 0 && (
        <Button type="submit" className="w-full" size="lg">
          Submit Form
        </Button>
      )}
      
      {fields.length === 0 && (
        <p className="text-center text-gray-500">
          No fields to display
        </p>
      )}
    </form>
  );
};