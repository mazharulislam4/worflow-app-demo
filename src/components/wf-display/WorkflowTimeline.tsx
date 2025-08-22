'use client';

import { useEffect, useState } from 'react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  eventType: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  jobType?: string;
  details?: {
    output?: unknown;
    error?: string;
    logs?: string[];
    jobs?: Array<{ id: string; type: string; label: string; status: string }>;
  };
}

interface ExecutionStep {
  event_type: string;
  data: {
    job_id?: string;
    job_label?: string;
    job_type?: string;
    status?: string;
    message?: string;
    success?: boolean;
    error?: string;
    duration?: number;
    output?: unknown;
    details?: string[];
    total_jobs?: number;
    completed_jobs?: number;
    jobs?: Array<{ id: string; type: string; label: string; status: string }>;
  };
  timestamp: string;
}

interface WorkflowTimelineProps {
  steps: ExecutionStep[];
  isExecuting: boolean;
}

export default function WorkflowTimeline({ steps, isExecuting }: WorkflowTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [runningJobs, setRunningJobs] = useState(new Set<string>());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    const events: TimelineEvent[] = [];
    const running = new Set<string>();

    // Process WebSocket steps into timeline events
    steps.forEach((step, index) => {
      const { event_type, data, timestamp } = step;

      switch (event_type) {
        case 'execution_started':
          events.push({
            id: `start-${timestamp}`,
            timestamp,
            eventType: 'execution_started',
            title: 'Workflow Started',
            description: data.message || 'Workflow execution has begun',
            status: 'running',
            jobType: 'system',
            details: { jobs: data.jobs }
          });
          break;

        case 'jobs_list':
          events.push({
            id: `jobs-${index}`,
            timestamp,
            eventType: 'jobs_list',
            title: 'Jobs Loaded',
            description: `${data.total_jobs} jobs prepared for execution`,
            status: 'completed',
            details: { jobs: data.jobs }
          });
          break;

        case 'job_started':
          events.push({
            id: `start-${data.job_id}-${index}`,
            timestamp,
            eventType: 'job_started',
            title: `Started: ${data.job_label || data.job_id}`,
            description: data.message || `Starting ${data.job_type} job`,
            status: 'running',
            jobType: data.job_type
          });
          if (data.job_id) {
            running.add(data.job_id);
          }
          break;

        case 'job_completed':
          // Log detailed job completion data to console
          console.log(`🔷 Job Completed: ${data.job_label || data.job_id}`, {
            jobType: data.job_type,
            success: data.success,
            duration: data.duration,
            output: data.output,
            error: data.error,
            message: data.message,
            allData: data
          });
          
          events.push({
            id: `complete-${data.job_id}-${index}`,
            timestamp,
            eventType: 'job_completed',
            title: `${data.success ? 'Completed' : 'Failed'}: ${data.job_label || data.job_id}`,
            description: data.message || `${data.job_type} job ${data.success ? 'completed successfully' : 'failed'}`,
            status: data.success ? 'completed' : 'failed',
            duration: data.duration,
            jobType: data.job_type,
            details: {
              output: data.output,
              error: data.error,
              logs: data.details
            }
          });
          if (data.job_id) {
            running.delete(data.job_id);
          }
          break;

        case 'status_update':
          events.push({
            id: `status-${index}`,
            timestamp,
            eventType: 'status_update',
            title: 'Status Update',
            description: data.message || 'Job execution completed',
            status: 'completed'
          });
          break;

        case 'execution_complete':
          events.push({
            id: `complete-${timestamp}`,
            timestamp,
            eventType: 'execution_complete',
            title: 'Workflow Completed',
            description: data.message || 'Workflow execution has finished',
            status: data.success ? 'completed' : 'failed',
            jobType: 'system',
            details: { jobs: data.jobs }
          });
          break;

        case 'job_started':
          // Log job start data to console
          console.log(`🔷 Job Started: ${data.job_label || data.job_id}`, {
            jobType: data.job_type,
            message: data.message,
            allData: data
          });
          
          if (data.job_id) {
            running.add(data.job_id);
          }
          events.push({
            id: `${data.job_id}-started`,
            timestamp,
            eventType: 'job_started',
            title: `${data.job_label || data.job_type || 'Job'} Started`,
            description: data.message || `Started ${data.job_type} job`,
            status: 'running',
            jobType: data.job_type,
            details: { output: data.output }
          });
          break;

        case 'job_completed':
          if (data.job_id) {
            running.delete(data.job_id);
          }
          events.push({
            id: `${data.job_id}-completed`,
            timestamp,
            eventType: 'job_completed',
            title: `${data.job_label || data.job_type || 'Job'} ${data.success ? 'Completed' : 'Failed'}`,
            description: data.message || 'Job execution completed',
            status: data.success ? 'completed' : 'failed',
            duration: data.duration,
            jobType: data.job_type,
            details: { 
              output: data.output, 
              error: data.error,
              logs: data.details 
            }
          });
          break;

        case 'execution_failed':
          events.push({
            id: `fail-${index}`,
            timestamp,
            eventType: 'execution_failed',
            title: 'Workflow Failed',
            description: data.message || 'Workflow execution failed',
            status: 'failed',
            details: { error: data.error }
          });
          break;
      }
    });

    setTimelineEvents(events);
    setRunningJobs(running);
  }, [steps]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        );
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
      default:
        return <div className="w-4 h-4 bg-blue-500 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'border-blue-500 bg-blue-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      case 'pending': return 'border-gray-300 bg-gray-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1) return `${Math.round(duration * 1000)}ms`;
    return `${duration.toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 1
      });
    } catch {
      return timestamp;
    }
  };

  const getJobTypeIcon = (jobType?: string) => {
    switch (jobType) {
      case 'runVM':
        return '🖥️';
      case 'runServer':
        return '🚀';
      case 'script':
        return '📜';
      case 'api_call':
        return '🌐';
      case 'condition':
        return '🔀';
      case 'start':
        return '▶️';
      case 'end':
        return '🏁';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-gray-100 px-4 py-3 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Real-time Timeline
          {isExecuting && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Running
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          {timelineEvents.length} events • {runningJobs.size} running
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline connector line */}
              {index < timelineEvents.length - 1 && (
                <div className="absolute left-6 top-8 w-0.5 h-8 bg-gray-200"></div>
              )}
              
              <div className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${getStatusColor(event.status)}`}>
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {event.jobType && (
                        <span className="text-lg">{getJobTypeIcon(event.jobType)}</span>
                      )}
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </h4>
                      {event.duration && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {formatDuration(event.duration)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {event.description}
                  </p>
                  
                  {/* Show additional details for job completions */}
                  {event.eventType === 'job_completed' && event.details && (
                    <div className="mt-2 text-xs">
                      {event.status === 'failed' && event.details.error && (
                        <div className="bg-red-100 text-red-700 p-2 rounded">
                          <span className="font-medium">Error:</span> {event.details.error}
                        </div>
                      )}
                      
                      {event.details.output && typeof event.details.output === 'object' && event.details.output !== null && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-800">📊 Job Details</span>
                            <button
                              onClick={() => setExpandedEvent(expandedEvent === `output-${event.id}` ? null : `output-${event.id}`)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              {expandedEvent === `output-${event.id}` ? 'Hide' : 'Show'} Details
                            </button>
                          </div>
                          
                          {expandedEvent === `output-${event.id}` && (
                            <div className="space-y-2">
                              <pre className="bg-gray-100 p-2 rounded text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(event.details.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      {event.details.output && typeof event.details.output !== 'object' && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3">
                          <span className="font-medium text-blue-800">Output: </span>
                          <span>{String(event.details.output)}</span>
                        </div>
                      )}

                      {event.details.logs && event.details.logs.length > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View logs ({event.details.logs.length})
                          </summary>
                          <div className="mt-1 bg-gray-100 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                            {event.details.logs.map((log: string, i: number) => (
                              <div key={i}>{log}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                  
                  {/* Show job list details */}
                  {event.eventType === 'execution_started' && event.details?.jobs && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-2"
                      >
                        <span className={`mr-1 transition-transform ${expandedEvent === event.id ? 'rotate-90' : ''}`}>▶</span>
                        View job list ({event.details.jobs.length})
                      </button>
                      {expandedEvent === event.id && (
                        <div className="space-y-1">
                          {event.details.jobs.map((job, i) => (
                            <div key={i} className="flex items-center justify-between text-sm px-2 py-1 bg-white rounded">
                              <span className="font-medium">{job.label || job.type}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator for running workflow */}
          {isExecuting && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-2"></div>
              <span className="text-sm text-gray-600">Waiting for more events...</span>
            </div>
          )}
          
          {/* Empty state */}
          {timelineEvents.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No timeline events yet</p>
              <p className="text-sm text-gray-400">Events will appear here during workflow execution</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
