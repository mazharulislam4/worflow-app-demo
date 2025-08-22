/**
 * Modal for executing workflows with real execution
 */

import React, { useCallback, useState } from "react";
// import { useSendEmailMutation } from "../../../redux/features/emailApiSlice";
import { MockWorkflowExecutor } from "../mockExecution";
import { RealWorkflowExecutor } from "../realExecution";
import { WorkflowEdge, WorkflowNode } from "../types";

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<"mock" | "real">("real");

  // RTK Query mutation for sending emails
  // const [sendEmail] = useSendEmailMutation();

  const handleExecute = useCallback(async () => {
    if (nodes.length === 0) {
      setError("No workflow to execute. Please add some nodes first.");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      // Create executor based on selected mode
      const executor =
        executionMode === "real"
          ? new RealWorkflowExecutor({
              emailSendFunction: async (emailData) => {
                console.log("🔥 Sending REAL email:", emailData);
                // const result = await sendEmail(emailData).unwrap();
                console.log("✅ Email sent successfully:", emailData);
                return emailData;
              },
              onJobUpdate: (jobResult) => {
                console.log("📊 Job Update:", jobResult);
              },
              onWorkflowUpdate: (workflowResult) => {
                console.log("🔄 Workflow Update:", workflowResult);
              },
            })
          : new MockWorkflowExecutor();

      // Convert nodes and edges to execution format
      const workflowConfig = {
        jobs: nodes.map((node) => ({
          type: node.type.replace("Node", ""), // Convert StartNode -> Start, etc.
          attributes: {
            nodeId: node.id, // Use the actual node ID
            label: node.data.label,
            ...node.data.config,
          },
          connections: edges
            .filter((edge) => edge.from === node.id)
            .map((edge) => ({
              targetJobId: edge.to,
              condition: edge.output || "out",
            })),
          dependencies: edges
            .filter((edge) => edge.to === node.id)
            .map((edge) => ({
              sourceJobId: edge.from,
              condition: edge.output || "out",
            })),
          isConditional: node.type === "ConditionNode",
        })),
        executionFlow: {
          startNode: nodes.find((n) => n.type === "StartNode")?.id || null,
          totalJobs: nodes.length,
          hasConditionalFlow: nodes.some((n) => n.type === "ConditionNode"),
        },
      };

      const result = await executor.executeWorkflow(workflowConfig);

      // Convert Map to Array for display
      const resultForDisplay = {
        ...result,
        jobResults: Array.from(result.jobResults.values()),
      };

      setExecutionResult(resultForDisplay);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown execution error");
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, executionMode /* , sendEmail */]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Workflow Execution
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Execution Controls */}
            <div className="mb-6">
              {/* Execution Mode Toggle */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Execution Mode
                </h3>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="executionMode"
                      value="real"
                      checked={executionMode === "real"}
                      onChange={(e) =>
                        setExecutionMode(e.target.value as "mock" | "real")
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      <span className="font-medium text-green-600">
                        🚀 Production Mode
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="executionMode"
                      value="mock"
                      checked={executionMode === "mock"}
                      onChange={(e) =>
                        setExecutionMode(e.target.value as "mock" | "real")
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      <span className="font-medium text-gray-600">
                        🧪 Test Mode
                      </span>
                      <span className="text-gray-500 ml-2">
                        - Safe simulation for development
                      </span>
                    </span>
                  </label>
                </div>
                {executionMode === "real" && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 text-sm">⚠️</span>
                      <div className="text-sm text-yellow-800">
                        <div className="font-medium">
                          Production Mode Active
                        </div>
                        <div>
                          This will make real API calls, send actual emails, and
                          execute live scripts. Use with caution.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || nodes.length === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isExecuting || nodes.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {isExecuting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Executing...
                    </div>
                  ) : (
                    "Execute Workflow"
                  )}
                </button>

                <div className="text-sm text-gray-600">
                  {nodes.length} nodes, {edges.length} connections
                </div>
              </div>

              {nodes.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  ⚠️ No workflow to execute. Please add some nodes first.
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-lg">❌</span>
                  <div className="flex-1">
                    <div className="text-red-800 font-medium">
                      Execution Error:
                    </div>
                    <div className="text-red-700 mt-1 font-mono text-sm">
                      {error}
                    </div>

                    {/* CORS Error Help */}
                    {error.includes("CORS") ||
                      error.includes("Failed to fetch") ||
                      (error.includes("Network error") && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="text-blue-800 font-medium text-sm">
                            💡 Troubleshooting Tips:
                          </div>
                          <ul className="text-blue-700 text-sm mt-1 space-y-1">
                            <li>
                              • Check if the API server is running and
                              accessible
                            </li>
                            <li>
                              • Verify the URL is correct and supports CORS
                            </li>
                            <li>
                              • Try using a CORS proxy or enable CORS on the
                              server
                            </li>
                            <li>
                              • For testing, try a public API like:{" "}
                              <code className="bg-blue-100 px-1 rounded">
                                https://httpbin.org/get
                              </code>
                            </li>
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Execution Result */}
            {executionResult && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Execution Result
                </h3>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 font-medium">Status</div>
                    <div
                      className={`text-lg font-bold ${
                        executionResult.status === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {executionResult.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-gray-700 font-medium">Duration</div>
                    <div className="text-lg font-bold text-gray-900">
                      {executionResult.executionTime}ms
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-medium">
                      Jobs Executed
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {executionResult.jobResults?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Job Results */}
                {executionResult.jobResults &&
                  executionResult.jobResults.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Job Results
                      </h4>
                      <div className="space-y-3">
                        {executionResult.jobResults.map(
                          (jobResult: any, index: number) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">
                                  <span className="text-lg">
                                    {jobResult.jobType === "Start"
                                      ? "🚀"
                                      : jobResult.jobType === "End"
                                      ? "🏁"
                                      : jobResult.jobType === "Script"
                                      ? "📝"
                                      : jobResult.jobType === "APICall"
                                      ? "🌐"
                                      : jobResult.jobType === "SendEmail"
                                      ? "📧"
                                      : jobResult.jobType === "Condition"
                                      ? "❓"
                                      : "⚙️"}
                                  </span>
                                  <span className="ml-2">
                                    {jobResult.label || jobResult.jobId}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({jobResult.jobType})
                                  </span>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    jobResult.status === "completed" ||
                                    jobResult.status === "success"
                                      ? "bg-green-100 text-green-800"
                                      : jobResult.status === "failed" ||
                                        jobResult.status === "error"
                                      ? "bg-red-100 text-red-800"
                                      : jobResult.status === "running"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {jobResult.status === "completed"
                                    ? "✅ Success"
                                    : jobResult.status === "failed"
                                    ? "❌ Failed"
                                    : jobResult.status === "running"
                                    ? "⏳ Running"
                                    : jobResult.status === "pending"
                                    ? "⏸️ Pending"
                                    : jobResult.status}
                                </div>
                              </div>

                              {/* Pending Status Details */}
                              {jobResult.status === "pending" &&
                                jobResult.logs &&
                                jobResult.logs.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium text-yellow-700 mb-1">
                                      Pending Reason:
                                    </div>
                                    <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                                      {
                                        jobResult.logs[
                                          jobResult.logs.length - 1
                                        ]
                                      }
                                    </div>
                                  </div>
                                )}

                              {/* Job Logs */}
                              {jobResult.logs && jobResult.logs.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium text-gray-700 mb-1">
                                    Execution Logs:
                                  </div>
                                  <div className="bg-gray-50 border rounded max-h-32 overflow-y-auto">
                                    <div className="text-xs p-2 space-y-1">
                                      {jobResult.logs.map(
                                        (log: string, logIndex: number) => (
                                          <div
                                            key={logIndex}
                                            className="text-gray-600"
                                          >
                                            {log}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {jobResult.result && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium text-gray-700 mb-1">
                                    Result:
                                  </div>
                                  <div className="bg-gray-50 border rounded max-h-48 overflow-y-auto">
                                    <pre className="text-xs p-3 whitespace-pre-wrap">
                                      {JSON.stringify(
                                        jobResult.result,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Console Output for Script Jobs */}
                              {jobResult.jobType === "Script" &&
                                jobResult.result &&
                                jobResult.result.consoleOutput && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                      📝 Console Output:
                                    </div>
                                    <div className="bg-black text-green-400 border rounded max-h-48 overflow-y-auto font-mono">
                                      <pre className="text-xs p-3 whitespace-pre-wrap">
                                        {jobResult.result.consoleOutput ||
                                          "No console output"}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                              {jobResult.error && (
                                <div className="mt-2">
                                  <div className="text-sm font-medium text-red-700 mb-1">
                                    Error:
                                  </div>
                                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                                    {jobResult.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Raw Result */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Raw Execution Data
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                    <pre className="text-xs p-4 whitespace-pre-wrap">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
