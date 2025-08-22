"use client";

/**
 * Main DAG Directed Acyclic Graph  Workflow Builder Application Component
 * Orchestrates all components and handles the + button workflow
 */

import { ReactFlowProvider } from "@xyflow/react";
import React, { useCallback, useRef, useState } from "react";
import { useCreateWorkflowMutation } from "../../redux/features/serviceManagementSlice";
import { ExecutionModal } from "./components/ExecutionModal";
import { NodePalette } from "./components/NodePalette";
import { NodeProperties } from "./components/NodeProperties";
import { WorkflowCanvas } from "./components/WorkflowCanvas";
import { useWorkflow } from "./hooks/useWorkflow";
import { NodeType } from "./types";

export const DAGWorkflowBuilder: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Redux mutation hook for saving workflows
  const [createWorkflow, { isLoading: isSaving }] = useCreateWorkflowMutation();

  const {
    nodes,
    edges,
    selectedNodeId,
    validation,
    addNode,
    addNodeWithContext,
    updateNode,
    deleteNode,
    moveNode,
    selectNode,
    duplicateNode,
    addEdge,
    deleteEdge,
    clearWorkflow,
    exportUIConfig,
    exportJobsConfig,
    importWorkflow,
    setDragging,
    getNodesNeedingConnections,
  } = useWorkflow();

  // Local state for UI
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(
    null
  );
  const [isAddingNode, setIsAddingNode] = useState(false);

  // Get selected node from nodes array
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  // Handle node type selection
  const handleNodeTypeSelect = useCallback(
    (nodeType: NodeType) => {
      setSelectedNodeType(nodeType);
    },
    [setSelectedNodeType]
  );

  // Handle adding node (from canvas click or + button)
  const handleNodeAdd = useCallback(
    (
      type: NodeType,
      position: { x: number; y: number },
      afterNodeId?: string,
      direction?: "top" | "bottom" | "left" | "right"
    ) => {
      if (afterNodeId && direction) {
        addNodeWithContext(type, { position, afterNodeId, direction });
      } else {
        addNode(type, position);
      }
    },
    [addNode, addNodeWithContext]
  );

  // Complete the add node process
  const handleAddNodeComplete = useCallback(() => {
    setIsAddingNode(false);
  }, [setIsAddingNode]);

  // Cancel adding node
  const handleCancelAdd = useCallback(() => {
    setIsAddingNode(false);
  }, [setIsAddingNode]);

  // Handle node selection
  const handleNodeSelectCanvas = useCallback(
    (nodeId: string | null) => {
      selectNode(nodeId);
    },
    [selectNode]
  );

  // Handle export functions with proper error handling
  const handleExportUI = useCallback(() => {
    try {
      const configJson = exportUIConfig();
      const blob = new Blob([configJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workflow-ui-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export UI failed:", error);
      alert("Failed to export UI configuration. Please try again.");
    }
  }, [exportUIConfig]);

  const handleExportJobs = useCallback(() => {
    if (!validation.isValid) {
      alert("Cannot export invalid workflow. Please fix all errors first.");
      return;
    }

    try {
      const jobsJson = exportJobsConfig();
      const blob = new Blob([jobsJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workflow-jobs-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export jobs failed:", error);
      alert("Failed to export jobs configuration. Please try again.");
    }
  }, [exportJobsConfig, validation.isValid]);

  // Handle import
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const config = JSON.parse(content);

          if (config.nodes && config.edges) {
            importWorkflow(config);
          } else {
            alert("Invalid workflow file format.");
          }
        } catch (error) {
          console.error("Import failed:", error);
          alert("Failed to import workflow. Please check the file format.");
        }
      };
      reader.readAsText(file);

      // Reset file input
      event.target.value = "";
    },
    [importWorkflow]
  );

  const handleClearWorkflow = useCallback(() => {
    if (nodes.length === 0) return;

    if (
      window.confirm(
        "Are you sure you want to clear the entire workflow? This action cannot be undone."
      )
    ) {
      clearWorkflow();
    }
  }, [clearWorkflow, nodes.length]);

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      duplicateNode(nodeId);
    },
    [duplicateNode]
  );

  // Save workflow handler
  const handleSaveWorkflow = useCallback(() => {
    if (!validation.isValid) {
      alert("Cannot save invalid workflow. Please fix all errors first.");
      return;
    }
    setIsSaveModalOpen(true);
  }, [validation.isValid]);

  const handleSaveConfirm = useCallback(async () => {
    if (!workflowName.trim()) {
      alert("Please enter a workflow name.");
      return;
    }

    try {
      // Get the jobs configuration JSON that the Export Jobs button generates
      const jobsJson = exportJobsConfig();
      const jobsData = JSON.parse(jobsJson); // Parse the JSON string to object

      console.log("Saving workflow with jobs data:", jobsData);

      await createWorkflow({
        name: workflowName.trim(),
        description: workflowDescription.trim() || `Workflow created with ${nodes.length} nodes`,
        workflow_data: jobsData, // Save the jobs configuration directly
        is_active: true
      }).unwrap();

      alert(`Workflow "${workflowName}" saved successfully with ${Object.keys(jobsData.jobs || {}).length} jobs!`);
      setIsSaveModalOpen(false);
      setWorkflowName("");
      setWorkflowDescription("");
    } catch (error) {
      console.error("Save workflow failed:", error);
      alert("Failed to save workflow. Please try again.");
    }
  }, [workflowName, workflowDescription, nodes, exportJobsConfig, createWorkflow]);

  // Handle closing properties panel
  const handleCloseProperties = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Toggle left sidebar
  const toggleLeftSidebar = useCallback(() => {
    setIsLeftSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: "none" }}
        />

        {/* Navbar - Full Width */}
        <div
          style={{
            backgroundColor: "#291cb4",
          }}
          className=" border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-6">
            {/* Sidebar toggle button */}
            <button
              onClick={toggleLeftSidebar}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 flex-shrink-0"
              title={isLeftSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="#fff"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="">
              <img src="/logo.svg" className="h-8 w-auto" alt="advensis" />
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>
                  {nodes.length} node{nodes.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  {edges.length} connection{edges.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  validation.isValid
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    validation.isValid ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {validation.isValid
                  ? "Valid Workflow"
                  : `${validation.errors.length} error${
                      validation.errors.length !== 1 ? "s" : ""
                    }`}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm text-white hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
            >
              <span>📁</span>
              <span>Import</span>
            </button>

            <button
              onClick={handleSaveWorkflow}
              className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!validation.isValid || nodes.length === 0 || isSaving}
            >
              <span>💾</span>
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>

            <button
              onClick={handleClearWorkflow}
              className="px-4 py-2 text-sm text-white hover:text-gray-800  border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.length === 0}
            >
              Clear All
            </button>

            <button
              onClick={handleExportUI}
              className="px-4 py-2 text-sm text-white hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.length === 0}
            >
              Export UI
            </button>

            <button
              onClick={() => setIsExecutionModalOpen(true)}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={nodes.length === 0}
            >
              <span>▶️</span>
              <span>Execute Workflow</span>
            </button>

            <button
              onClick={handleExportJobs}
              className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!validation.isValid || nodes.length === 0}
            >
              <span>🚀</span>
              <span>Export Jobs</span>
            </button>
          </div>
        </div>

        {/* Main Content Area - Below Navbar */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Node Palette - Collapsible */}
          {!isLeftSidebarCollapsed && (
            <div className="w-[300px] bg-white border-r border-gray-200 flex-shrink-0">
              <NodePalette
                onNodeSelect={handleNodeTypeSelect}
                selectedNodeType={selectedNodeType}
                isAddingNode={isAddingNode}
                onCancelAdd={handleCancelAdd}
              />
            </div>
          )}

          {/* Center - Workflow Canvas */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Validation messages */}
            {!validation.isValid && validation.errors.length > 0 && (
              <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex-shrink-0">
                <div className="text-sm text-red-800">
                  <div className="font-medium mb-1">
                    ⚠️ Workflow Validation Errors:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex-shrink-0">
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">⚠️ Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-700">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Canvas */}
            <div className="flex-1 w-full h-full min-h-0">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNodeId}
                onNodeSelect={handleNodeSelectCanvas}
                onNodeMove={moveNode}
                onNodeAdd={handleNodeAdd}
                onEdgeAdd={addEdge}
                onEdgeDelete={deleteEdge}
                onDeleteNode={deleteNode}
              />
            </div>
          </div>

          {/* Right Panel - Node Properties - Fixed Size */}
          {selectedNode && (
            <div className="w-[400px] bg-white border-l border-gray-200 flex-shrink-0 overflow-hidden">
              <NodeProperties
                key={selectedNode.id}
                node={selectedNode}
                onUpdateNode={updateNode}
                onDeleteNode={deleteNode}
                onDuplicateNode={handleDuplicateNode}
                onClose={handleCloseProperties}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Workflow Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Workflow</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Enter workflow description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!workflowName.trim() || isSaving}
              >
                {isSaving ? "Saving..." : "Save Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Modal */}
      <ExecutionModal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        nodes={nodes}
        edges={edges}
      />
    </ReactFlowProvider>
  );
};
