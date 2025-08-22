'use client';

import { JobStep } from './JobExecutionCard';

interface WorkflowTimelineProps {
  steps: JobStep[];
  isExecuting: boolean;
}

export default function WorkflowTimeline({ steps, isExecuting }: WorkflowTimelineProps) {
  const uniqueSteps = steps.filter((step, index, self) => 
    index === self.findIndex(s => s.data.job_id === step.data.job_id)
  );

  const getStepStatus = (step: JobStep) => {
    if (step.data.status === 'completed') return 'completed';
    if (step.data.status === 'failed' || step.data.error) return 'failed';
    if (step.data.status === 'running') return 'running';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'running':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return (
          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
        );
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 bg-white border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timeline ({uniqueSteps.length})
        </h3>
        <p className="text-sm text-gray-500 mt-1">Real-time execution progress</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isExecuting && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-3"></div>
              <div className="text-sm font-medium text-blue-800">
                Execution in progress...
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Live updates enabled
            </div>
          </div>
        )}

        <div className="space-y-4">
          {uniqueSteps.map((step, index) => {
            const status = getStepStatus(step);
            const isLast = index === uniqueSteps.length - 1;

            return (
              <div key={step.data.job_id || index} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[18px] top-8 w-0.5 h-8 bg-gray-200"></div>
                )}

                {/* Timeline item */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-full ${
                      status === 'completed' ? 'bg-green-100' :
                      status === 'failed' ? 'bg-red-100' :
                      status === 'running' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {getStatusIcon(status)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {step.data.job_label || step.data.job_id || `Job ${index + 1}`}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'completed' ? 'bg-green-100 text-green-800' :
                          status === 'failed' ? 'bg-red-100 text-red-800' :
                          status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Type:</span>
                          <span className="ml-1 text-blue-600 font-semibold">
                            {step.data.job_type || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Time:</span>
                          <span className="ml-1">{formatTimestamp(step.timestamp)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Event:</span>
                          <span className="ml-1 text-purple-600">
                            {step.event_type}
                          </span>
                        </div>
                        {step.data.output?.exit_code !== undefined && (
                          <div>
                            <span className="font-medium">Exit:</span>
                            <span className={`ml-1 font-bold ${
                              step.data.output.exit_code === 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {step.data.output.exit_code}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress indicator */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>
                            {status === 'completed' ? '100%' :
                             status === 'failed' ? 'Failed' :
                             status === 'running' ? '50%' :
                             '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              status === 'completed' ? 'bg-green-500' :
                              status === 'failed' ? 'bg-red-500' :
                              status === 'running' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}
                            style={{ 
                              width: status === 'completed' ? '100%' :
                                     status === 'failed' ? '100%' :
                                     status === 'running' ? '50%' :
                                     '0%'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Quick output preview */}
                      {step.data.output?.stdout && (
                        <div className="mt-3 bg-gray-50 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Output Preview:</div>
                          <div className="text-xs font-mono text-gray-700 max-h-16 overflow-hidden">
                            {step.data.output.stdout.slice(0, 100)}
                            {step.data.output.stdout.length > 100 && '...'}
                          </div>
                        </div>
                      )}

                      {/* Error preview */}
                      {(step.data.output?.stderr || step.data.error) && (
                        <div className="mt-3 bg-red-50 rounded p-2">
                          <div className="text-xs text-red-500 mb-1">Error:</div>
                          <div className="text-xs font-mono text-red-700 max-h-16 overflow-hidden">
                            {step.data.error || step.data.output?.stderr?.slice(0, 100)}
                            {(step.data.output?.stderr?.length || 0) > 100 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {uniqueSteps.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-sm text-gray-500">Timeline will update as jobs execute</p>
          </div>
        )}

        {/* Live indicator at bottom */}
        {isExecuting && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700">Live Timeline</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
