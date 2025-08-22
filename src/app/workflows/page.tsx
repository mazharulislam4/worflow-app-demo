'use client';

import WorkflowCard from '@/components/wf-display/WorkflowCard';
import WorkflowExecutionDashboard from '@/components/wf-exicutor/WorkflowExecutionDashboard';
import { useDeleteWorkflowMutation, useGetWorkflowsQuery, Workflow } from '@/redux/features/serviceManagementSlice';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Job {
  type: string;
  attributes: {
    label: string;
    nodeId: string;
    description?: string;
    [key: string]: unknown;
  };
  connections?: Connection[];
  dependencies?: Dependency[];
  isConditional?: boolean;
}

interface Connection {
  condition?: string;
  targetJobId: string;
}

interface Dependency {
  condition?: string;
  sourceJobId: string;
}

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

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

export default function Home() {
  const router = useRouter();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Redux hooks
  const { data: workflows = [], refetch: refetchWorkflows } = useGetWorkflowsQuery();
  const [deleteWorkflow] = useDeleteWorkflowMutation();

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await deleteWorkflow(workflowId).unwrap();
        // Refetch workflows after successful deletion
        refetchWorkflows();
      } catch (error) {
        console.error('Error deleting workflow:', error);
        alert('Failed to delete workflow');
      }
    }
  };

  const handleViewLogs = (workflowId: number) => {
    router.push(`/requests?workflow_id=${workflowId}`);
  };

  const executeWorkflow = async (workflowId: number) => {
    try {
      setIsExecuting(true);
      setSteps([]);
      setShowDashboard(true);
      
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setSelectedWorkflow(workflow);
      }
      
      const response = await axios.post(`${API_BASE}/workflow/api/workflows/${workflowId}/execute/`, {
        input_data: {}
      });
      
      const newExecutionId = response.data.execution_id;
      setExecutionId(newExecutionId);
      
      // Connect to WebSocket for real-time updates
      connectWebSocket(newExecutionId);
      
    } catch (error) {
      console.error('Error executing workflow:', error);
      setIsExecuting(false);
      setShowDashboard(false);
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
      console.log('WebSocket message received:', data);
      
      // Skip the initial connection message
      if (data.event_type === 'websocket_connected') {
        return;
      }
      
      // Handle execution completion
      if (data.event_type === 'execution_completed') {
        setIsExecuting(false);
      } else if (data.event_type === 'execution_failed') {
        setIsExecuting(false);
      }
      
      // Add to steps for detailed view
      setSteps((prev: ExecutionStep[]) => [...prev, {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      }]);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
    setExecutionId(null);
    setSteps([]);
    setIsExecuting(false);
    setSelectedWorkflow(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-semibold text-gray-900">{workflows.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Tools</p>
                <p className="text-2xl font-semibold text-gray-900">7</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExecuting ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {isExecuting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-2xl font-semibold ${isExecuting ? 'text-blue-600' : 'text-gray-900'}`}>
                  {isExecuting ? 'Running' : 'Ready'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Workflows</h2>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Found</h3>
              <p className="text-gray-500">Create your first workflow to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onExecute={executeWorkflow}
                  onDelete={handleDeleteWorkflow}
                  onViewLogs={handleViewLogs}
                  isExecuting={isExecuting && selectedWorkflow?.id === workflow.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Execution Dashboard Modal */}
      {showDashboard && (
        <WorkflowExecutionDashboard
          executionId={executionId}
          steps={steps.map((step, index) => ({
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
          onClose={handleCloseDashboard}
        />
      )}
    </div>
  );
}
