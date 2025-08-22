/**
 * Advanced node properties panel with form-like editing capabilities
 * Right sidebar for editing selected node configurations
 */

import { debounce } from "lodash";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getNodeConfig } from "../nodeConfigs";
import { NodePropertiesProps } from "../types";

// Memoized AccordionSection component to prevent unnecessary re-renders
const AccordionSection = memo(
  ({
    title,
    sectionKey,
    children,
    isExpanded,
    onToggle,
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: (sectionKey: string) => void;
  }) => {
    return (
      <div className="border w-full border-gray-200 rounded-md overflow-hidden">
        <button
          onClick={() => onToggle(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
        >
          <span className="font-medium text-gray-800">{title}</span>
          <span
            className={`transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {isExpanded && <div className="p-4 space-y-4 bg-white">{children}</div>}
      </div>
    );
  }
);

AccordionSection.displayName = "AccordionSection";

export const NodeProperties = memo<NodePropertiesProps>(
  ({ node, onUpdateNode, onDeleteNode, onDuplicateNode, onClose }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
      new Set(["basic", "configuration"])
    );

    // Local state for form values to prevent focus loss
    const [localValues, setLocalValues] = useState<Record<string, any>>({});
    const [localLabel, setLocalLabel] = useState("");

    // Ref to track if we're currently syncing to prevent loops
    const syncingRef = useRef(false);

    // Initialize local values when node changes
    useEffect(() => {
      if (node && !syncingRef.current) {
        setLocalValues(node.data.config || {});
        setLocalLabel(node.data.label || "");
      }
    }, [node?.id]); // Only update when node ID changes, not on every render

    // Memoized debounced sync function with proper cleanup
    const debouncedSyncToParent = useMemo(() => {
      const debouncedFn = debounce(
        (nodeId: string, label: string, config: Record<string, any>) => {
          if (onUpdateNode && !syncingRef.current) {
            syncingRef.current = true;
            onUpdateNode(nodeId, {
              label,
              config,
            });
            // Reset flag after a short delay to allow for state updates
            setTimeout(() => {
              syncingRef.current = false;
            }, 50);
          }
        },
        300
      );

      return debouncedFn;
    }, [onUpdateNode]);

    // Cleanup debounced function on unmount
    useEffect(() => {
      return () => {
        debouncedSyncToParent.cancel();
      };
    }, [debouncedSyncToParent]);

    const toggleSection = useCallback((section: string) => {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(section)) {
          newSet.delete(section);
        } else {
          newSet.add(section);
        }
        return newSet;
      });
    }, []);

    // Memoized handlers to prevent recreation on every render
    const handleConfigChange = useCallback(
      (key: string, value: any) => {
        setLocalValues((prev) => {
          const newValues = { ...prev, [key]: value };
          // Trigger debounced sync to parent
          if (node) {
            debouncedSyncToParent(node.id, localLabel, newValues);
          }
          return newValues;
        });
      },
      [node?.id, localLabel, debouncedSyncToParent]
    );

    // Optimized handler for condition changes to prevent array recreation
    const handleConditionChange = useCallback(
      (key: string, conditionIndex: number, field: string, value: any) => {
        setLocalValues((prev) => {
          const currentConditions = Array.isArray(prev[key]) ? prev[key] : [];
          const newConditions = currentConditions.map(
            (condition: any, index: number) =>
              index === conditionIndex
                ? { ...condition, [field]: value }
                : condition
          );
          const newValues = { ...prev, [key]: newConditions };

          // Trigger debounced sync to parent
          if (node) {
            debouncedSyncToParent(node.id, localLabel, newValues);
          }
          return newValues;
        });
      },
      [node?.id, localLabel, debouncedSyncToParent]
    );

    const handleConditionRemove = useCallback(
      (key: string, conditionIndex: number) => {
        setLocalValues((prev) => {
          const currentConditions = Array.isArray(prev[key]) ? prev[key] : [];
          const newConditions = currentConditions.filter(
            (_: any, index: number) => index !== conditionIndex
          );
          const newValues = { ...prev, [key]: newConditions };

          // Trigger debounced sync to parent
          if (node) {
            debouncedSyncToParent(node.id, localLabel, newValues);
          }
          return newValues;
        });
      },
      [node?.id, localLabel, debouncedSyncToParent]
    );

    const handleConditionAdd = useCallback(
      (key: string) => {
        setLocalValues((prev) => {
          const currentConditions = Array.isArray(prev[key]) ? prev[key] : [];
          const newConditions = [
            ...currentConditions,
            { field: "", operator: "equals", value: "" },
          ];
          const newValues = { ...prev, [key]: newConditions };

          // Trigger debounced sync to parent
          if (node) {
            debouncedSyncToParent(node.id, localLabel, newValues);
          }
          return newValues;
        });
      },
      [node?.id, localLabel, debouncedSyncToParent]
    );

    const handleLabelChange = useCallback(
      (label: string) => {
        setLocalLabel(label);
        // Trigger debounced sync to parent
        if (node) {
          debouncedSyncToParent(node.id, label, localValues);
        }
      },
      [node?.id, localValues, debouncedSyncToParent]
    );

    const renderField = useCallback(
      (key: string, fieldConfig: any, value: any) => {
        const { type, label, placeholder, options, required } = fieldConfig;
        const currentValue =
          localValues[key] !== undefined ? localValues[key] : value;

        switch (type) {
          case "text":
            return (
              <input
                type="text"
                value={currentValue || ""}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            );

          case "textarea":
            return (
              <textarea
                value={currentValue || ""}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              />
            );

          case "code":
            return (
              <textarea
                value={currentValue || ""}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={placeholder}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm transition-all"
              />
            );

          case "select":
            const selectOptions = options.map((option: string) => ({
              value: option,
              label: option.charAt(0).toUpperCase() + option.slice(1),
            }));

            return (
              <select
                value={currentValue || fieldConfig.default || ""}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select an option</option>
                {selectOptions.map(
                  (option: { value: string; label: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
            );

          case "checkbox":
            return (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentValue || false}
                  onChange={(e) => handleConfigChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            );

          case "tags":
            const tags = Array.isArray(currentValue) ? currentValue : [];
            return (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 min-h-[2rem] p-2 border border-gray-300 rounded-md bg-gray-50">
                  {tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = tags.filter((_, i) => i !== index);
                          handleConfigChange(key, newTags);
                        }}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const newTag = e.currentTarget.value.trim();
                      if (!tags.includes(newTag)) {
                        handleConfigChange(key, [...tags, newTag]);
                      }
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            );

          case "json":
            const jsonValue =
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : value || "";
            return (
              <textarea
                value={jsonValue}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleConfigChange(key, parsed);
                  } catch {
                    // Invalid JSON, store as string for now
                    handleConfigChange(key, e.target.value);
                  }
                }}
                placeholder={placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm transition-all"
              />
            );

          case "date":
            return (
              <input
                type="date"
                value={currentValue || ""}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            );

          case "conditions":
            const conditions = Array.isArray(currentValue)
              ? currentValue
              : [{ field: "", operator: "equals", value: "" }];
            return (
              <div className="space-y-3">
                {conditions.map((condition: any, index: number) => (
                  <div
                    key={`condition-${index}`}
                    className="p-3 border border-gray-200 rounded-md bg-gray-50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Condition {index + 1}
                      </span>
                      {conditions.length > 1 && (
                        <button
                          onClick={() => handleConditionRemove(key, index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Field name"
                      value={condition.field || ""}
                      onChange={(e) =>
                        handleConditionChange(
                          key,
                          index,
                          "field",
                          e.target.value
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <select
                      value={condition.operator || "equals"}
                      onChange={(e) =>
                        handleConditionChange(
                          key,
                          index,
                          "operator",
                          e.target.value
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="contains">Contains</option>
                      <option value="not_contains">Not Contains</option>
                      <option value="is_empty">Is Empty</option>
                      <option value="is_not_empty">Is Not Empty</option>
                    </select>

                    {!["is_empty", "is_not_empty"].includes(
                      condition.operator
                    ) && (
                      <input
                        type="text"
                        placeholder="Value"
                        value={condition.value || ""}
                        onChange={(e) =>
                          handleConditionChange(
                            key,
                            index,
                            "value",
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={() => handleConditionAdd(key)}
                  className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                >
                  + Add Condition
                </button>
              </div>
            );

          default:
            return (
              <input
                type="text"
                value={currentValue || ""}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            );
        }
      },
      [
        localValues,
        handleConfigChange,
        handleConditionChange,
        handleConditionRemove,
        handleConditionAdd,
      ]
    );

    if (!node) {
      return (
        <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <div className="text-5xl mb-4 opacity-50">⚙️</div>
              <div className="text-lg font-medium mb-2">No Node Selected</div>
              <div className="text-sm">
                Select a node from the canvas to edit its properties
              </div>
            </div>
          </div>
        </div>
      );
    }

    const config = getNodeConfig(node.type);

    return (
      <div className="w-[400px] h-full bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className="text-2xl flex-shrink-0"
                role="img"
                aria-label={config.label}
              >
                {config.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {config.label}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200 flex-shrink-0"
                title="Close properties panel (Esc)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {onDuplicateNode && (
              <button
                onClick={() => onDuplicateNode(node.id)}
                className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                Duplicate
              </button>
            )}
            <button
              onClick={() => onDeleteNode(node.id)}
              className="flex-1 px-3 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Settings */}
          <AccordionSection
            title="Basic Settings"
            sectionKey="basic"
            isExpanded={expandedSections.has("basic")}
            onToggle={toggleSection}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={localLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter node label"
              />
            </div>
          </AccordionSection>

          {/* Node Configuration */}
          <AccordionSection
            title="Configuration"
            sectionKey="configuration"
            isExpanded={expandedSections.has("configuration")}
            onToggle={toggleSection}
          >
            {Object.entries(config.schema).map(([key, fieldConfig]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {fieldConfig.label}
                  {fieldConfig.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(key, fieldConfig, node.data.config[key])}
              </div>
            ))}
          </AccordionSection>

          {/* Connection Info */}
          <AccordionSection
            title="Connections"
            sectionKey="connections"
            isExpanded={expandedSections.has("connections")}
            onToggle={toggleSection}
          >
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Available Handles
              </h4>
              <div className="space-y-2">
                {config.handles.map((handle) => (
                  <div
                    key={handle.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        handle.type === "input"
                          ? "bg-gray-400"
                          : handle.id === "true"
                          ? "bg-green-500"
                          : handle.id === "false"
                          ? "bg-red-500"
                          : "bg-blue-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {handle.label || handle.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {handle.type === "input" ? "Input" : "Output"} •{" "}
                        {handle.position}
                        {handle.required && " • Required"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo
    return (
      prevProps.node?.id === nextProps.node?.id &&
      prevProps.node?.data?.label === nextProps.node?.data?.label &&
      JSON.stringify(prevProps.node?.data?.config) ===
        JSON.stringify(nextProps.node?.data?.config) &&
      prevProps.onUpdateNode === nextProps.onUpdateNode &&
      prevProps.onDeleteNode === nextProps.onDeleteNode &&
      prevProps.onDuplicateNode === nextProps.onDuplicateNode &&
      prevProps.onClose === nextProps.onClose
    );
  }
);

NodeProperties.displayName = "NodeProperties";
