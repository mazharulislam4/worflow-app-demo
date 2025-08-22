"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import React, { useEffect, useRef, useState } from 'react';
import WorkflowExecutionDashboard from "../../components/wf-display/WorkflowExecutionDashboard";
import { ServiceRequest, useGetServiceRequestsQuery, useGetWorkflowExecutionsQuery } from "../../redux/features/serviceManagementSlice";

interface ExecutionStep {
  event_type: string;
  data: {
    job_id?: string;
    job_label?: string;
    job_type?: string;
    status?: string;
    output?: {
      stdout?: string;
      stderr?: string;
      exit_code?: number;
      language?: string;
      locals?: Record<string, unknown>;
    };
    error?: string;
    message?: string;
    completed_jobs?: number;
    total_jobs?: number;
  };
  timestamp: string;
}

interface RequestWithExecution extends ServiceRequest {
  execution_id?: string;
  execution_status?: string;
}

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

const RequestsPage = () => {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useGetServiceRequestsQuery();
  const { data: executions, isLoading: executionsLoading, refetch: refetchExecutions } = useGetWorkflowExecutionsQuery();

  // Cleanup WS
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const requestsWithExecutions: RequestWithExecution[] = React.useMemo(() => {
    if (!requests || !executions) return [];
    
    return requests.map(request => {
      const execution = executions.find(exec => exec.workflow === request.catalog_detail?.wf_id);
      return {
        ...request,
        execution_id: execution?.execution_id,
        execution_status: execution?.status
      };
    });
  }, [requests, executions]);

  const handleViewLog = async (workflowId: number) => {
    setIsExecuting(true);
    setExecutionSteps([]);
    setExecutionModalOpen(true);
    setSelectedExecution(null);

    try {
      // Call execute API to start a new execution
      const response = await fetch(`http://localhost:8000/workflow/api/workflows/${workflowId}/execute/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: {} })
      });
      const data = await response.json();
      const newExecutionId = data.execution_id;
      setSelectedExecution(newExecutionId);
      connectWebSocket(newExecutionId);
    } catch (err) {
      setIsExecuting(false);
      setExecutionModalOpen(false);
      setExecutionSteps([]);
      setSelectedExecution(null);
      alert('Failed to start workflow execution.');
    }
  };

  const connectWebSocket = (execId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const ws = new WebSocket(`${WS_BASE}/workflow/ws/execution/${execId}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS message:', data);

      if (data.event_type === 'websocket_connected') return;

      if (data.event_type === 'execution_completed' || data.event_type === 'execution_failed') {
        setIsExecuting(false);
      }
      

      setExecutionSteps((prev) => [...prev, {
        event_type: data.event_type || data.type,
        data: {
          job_id: data.job_id,
          job_label: data.job_label || data.job_id,
          job_type: data.job_type || 'unknown',
          status: data.success !== undefined ? (data.success ? 'completed' : 'failed') : 
                  data.type === 'job_started' ? 'running' : 'pending',
          output: data.result ? {
            stdout: typeof data.result === 'string' ? data.result : JSON.stringify(data.result),
            exit_code: data.success ? 0 : 1
          } : undefined,
          error: data.error,
          message: data.message
        },
        timestamp: data.timestamp || new Date().toISOString()
      }]);
    };
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    ws.onerror = () => {
      console.error('WebSocket error');
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-50 text-green-700 border-green-200";
      case "running": return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "failed": return "bg-red-50 text-red-700 border-red-200";
      case "cancelled": return "bg-gray-50 text-gray-700 border-gray-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "running": return "🔄";
      case "pending": return "⏳";
      case "failed": return "❌";
      case "cancelled": return "🚫";
      default: return "📄";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (requestsLoading || executionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Service Requests</h1>
            <p className="text-gray-600 mt-2">Monitor your service requests and workflow executions</p>
          </div>
          <Button 
            onClick={() => { refetchRequests(); refetchExecutions(); }}
            variant="outline"
            className="px-6 py-2"
          >
            🔄 Refresh
          </Button>
        </div>

        {requestsWithExecutions.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-20 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No service requests found</h3>
              <p className="text-gray-600 mb-6">You haven&apos;t submitted any service requests yet.</p>
              <Button 
                onClick={() => window.location.href = '/service-management'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Create Service Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requestsWithExecutions.map((request) => (
              <Card key={request.id} className="hover:shadow-lg border-l-4 border-l-blue-500">
                <CardHeader className="pb-4 flex justify-between">
                  <div>
                    <CardTitle className="text-xl">{request.catalog_detail?.name || `Request #${request.id}`}</CardTitle>
                    <div className="text-sm text-gray-500 mt-2 flex gap-4">
                      <span>📅 Created: {formatDate(request.created_at)}</span>
                      <span>🔄 Updated: {formatDate(request.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className={`px-4 py-2 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)} {request.status.toUpperCase()}
                    </span>
                    {request.execution_status && (
                      <span className={`px-4 py-2 rounded-full text-xs font-semibold border ${getStatusColor(request.execution_status)}`}>
                        {getStatusIcon(request.execution_status)} {request.execution_status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm font-semibold">🛠️ Service</div>
                      <div className="text-sm text-gray-600">{request.catalog_detail?.name || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">⚙️ Workflow</div>
                      <div className="text-sm text-gray-600">{request.catalog_detail?.wf_detail?.name || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">📊 Status</div>
                      <div className="text-sm text-gray-600">{request.status}</div>
                    </div>
                    <div className="flex items-end justify-end">
                      {request.catalog_detail?.wf_id ? (
                        <Button
                          onClick={() => handleViewLog(request.catalog_detail.wf_id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                          📋 View Logs
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                          ❌ No workflow
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {executionModalOpen && selectedExecution && (
          <Drawer open={executionModalOpen} onOpenChange={(open) => {
            setExecutionModalOpen(open);
            if (!open) {
              setSelectedExecution(null);
              setExecutionSteps([]);
              setIsExecuting(false);
              if (wsRef.current) wsRef.current.close();
            }
          }}>
            <DrawerContent className="h-[98vh] flex flex-col">
              <DrawerHeader className="px-8 py-6 border-b flex justify-between">
                <div>
                  <DrawerTitle className="text-2xl font-bold">Workflow Execution Logs</DrawerTitle>
                  <div className="text-sm text-gray-500 mt-1">
                    Execution ID: {selectedExecution}
                  </div>
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => {
                    setExecutionModalOpen(false);
                    setSelectedExecution(null);
                    setExecutionSteps([]);
                    setIsExecuting(false);
                    if (wsRef.current) wsRef.current.close();
                  }}>
                  ✕ Close
                </Button>
              </DrawerHeader>
              <div className="flex-1 overflow-hidden p-4">


                <WorkflowExecutionDashboard
                  executionId={selectedExecution}
                  steps={executionSteps.map((step, index) => ({
                    id: step.data.job_id || `step-${index}`,
                    name: step.data.job_label || step.data.job_id || `Step ${index + 1}`,
                    status: step.data.status === 'completed' ? 'completed' as const :
                           step.data.status === 'failed' ? 'failed' as const :
                           step.data.status === 'running' ? 'running' as const : 'pending' as const,
                    event_type: step.event_type,
                    data: step.data,
                    timestamp: step.timestamp
                  }))}
                  isExecuting={isExecuting}
                  onClose={() => {
                    setExecutionModalOpen(false);
                    setSelectedExecution(null);
                    setExecutionSteps([]);
                    setIsExecuting(false);
                    if (wsRef.current) wsRef.current.close();
                  }}
                />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
};

export default RequestsPage;
