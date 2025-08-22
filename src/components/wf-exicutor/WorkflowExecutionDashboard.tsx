'use client';

import { useEffect, useState } from 'react';
import { JobStep } from './JobExecutionCard';
import WorkflowTimeline from './WorkflowTimeline';

interface WorkflowExecutionDashboardProps {
  executionId: string | null;
  steps: JobStep[];
  isExecuting: boolean;
  onClose: () => void;
}

export default function WorkflowExecutionDashboard({ 
  executionId, 
  steps, 
  isExecuting, 
  onClose 
}: WorkflowExecutionDashboardProps) {
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(new Set<string>());
  const [failedJobs, setFailedJobs] = useState(new Set<string>());
  const [expandedJobs, setExpandedJobs] = useState(new Set<string>());

  useEffect(() => {
    // Update job states based on steps
    const newCompletedJobs = new Set<string>();
    const newFailedJobs = new Set<string>();

    steps.forEach(step => {
      if (step.data.job_id) {
        if (step.data.status === 'completed') {
          newCompletedJobs.add(step.data.job_id);
        } else if (step.data.status === 'failed' || step.data.error) {
          newFailedJobs.add(step.data.job_id);
        }
      }
    });

    setCompletedJobs(newCompletedJobs);
    setFailedJobs(newFailedJobs);

    // Update current job index
    const jobSteps = steps.filter(step => step.data.job_id);
    setCurrentJobIndex(jobSteps.length > 0 ? jobSteps.length - 1 : 0);
  }, [steps]);

  const getOverallProgress = () => {
    if (steps.length === 0) return 0;
    
    // Fallback: use job completion ratio
    const jobSteps = steps.filter(step => step.data.job_id);
    const completed = Array.from(completedJobs).length;
    return jobSteps.length > 0 ? (completed / jobSteps.length) * 100 : 0;
  };

  const getExecutionStatus = () => {
    if (!isExecuting && steps.length > 0) {
      const hasFailedJobs = failedJobs.size > 0;
      return hasFailedJobs ? 'failed' : 'completed';
    }
    return isExecuting ? 'running' : 'pending';
  };

  const getStatusText = () => {
    const status = getExecutionStatus();
    switch (status) {
      case 'completed':
        return 'Execution Completed';
      case 'failed':
        return 'Execution Failed';
      case 'running':
        return 'Execution In Progress';
      default:
        return 'Waiting to Start';
    }
  };

  if (!executionId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[98%] h-[95%] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              {isExecuting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">Workflow Execution</h2>
                <p className="text-blue-100 text-xs">ID: {executionId}</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded px-3 py-1">
              <div className="text-xs font-medium">{getStatusText()}</div>
              <div className="text-lg font-bold">{Math.round(getOverallProgress())}%</div>
            </div>

            <div className="text-xs text-blue-100">
              {completedJobs.size} completed • {failedJobs.size} failed • {steps.filter(s => s.data.job_id).length} total
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thin Progress Bar */}
        <div className="bg-gray-200 h-1">
          <div 
            className={`h-1 transition-all duration-500 ${
              getExecutionStatus() === 'failed' ? 'bg-red-500' : 
              getExecutionStatus() === 'completed' ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${getOverallProgress()}%` }}
          ></div>
        </div>

        {/* Main Content - Maximized Space */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Enhanced Job Accordion */}
          <div className="w-96 bg-gray-50 border-r flex flex-col">
            <div className="p-4 bg-white border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 712-2h2a2 2 0 712 2" />
                </svg>
                Jobs ({steps.filter(s => s.data.job_id).length})
              </h3>
              <p className="text-sm text-gray-500 mt-1">Click to expand job details</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {steps.filter(step => step.data.job_id).map((step, index) => {
                const isActive = currentJobIndex === index;
                const isCompleted = completedJobs.has(step.data.job_id!);
                const isFailed = failedJobs.has(step.data.job_id!);
                const isExpanded = expandedJobs.has(step.data.job_id!);

                const toggleExpanded = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const newExpanded = new Set(expandedJobs);
                  if (isExpanded) {
                    newExpanded.delete(step.data.job_id!);
                  } else {
                    newExpanded.add(step.data.job_id!);
                  }
                  setExpandedJobs(newExpanded);
                };

                return (
                  <div
                    key={`${step.data.job_id}-${index}`}
                    className={`rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {/* Job Header - Always Visible */}
                    <div 
                      onClick={() => setCurrentJobIndex(index)}
                      className="p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {isFailed ? (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 8 8">
                                <path d="M1.41 0l-1.41 1.41.72.72 1.78 1.81-1.78 1.81-.72.72 1.41 1.41.72-.72 1.81-1.78 1.81 1.78.72.72 1.41-1.41-.72-.72-1.78-1.81 1.78-1.81.72-.72-1.41-1.41-.72.72-1.81 1.78-1.81-1.78-.72-.72z"/>
                              </svg>
                            </div>
                          ) : isCompleted ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 8 8">
                                <path d="M6.41 0l-.69.72-2.78 2.78-.81-.78-.72-.72-1.41 1.41.72.72 1.5 1.5.69.72.72-.72 3.5-3.5.72-.72-1.44-1.41z"/>
                              </svg>
                            </div>
                          ) : isExecuting ? (
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                          ) : (
                            <div className="w-6 h-6 bg-gray-300 rounded-full mr-3"></div>
                          )}
                          
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 truncate">
                              {step.data.job_label || step.data.job_id || `Job ${index + 1}`}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {step.timestamp?.slice(11, 19)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {step.event_type}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {step.data.job_type && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              {step.data.job_type}
                            </span>
                          )}
                          
                          <button
                            onClick={toggleExpanded}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <svg 
                              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Quick Status Bar */}
                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-medium ${
                          isFailed ? 'text-red-600' : 
                          isCompleted ? 'text-green-600' : 
                          'text-yellow-600'
                        }`}>
                          {isFailed ? 'Failed' : 
                           isCompleted ? 'Completed' : 
                           'Running'}
                        </div>
                        
                        {step.data.output?.exit_code !== undefined && (
                          <div className="text-xs text-gray-500">
                            Exit: <span className={step.data.output.exit_code === 0 ? 'text-green-600' : 'text-red-600'}>
                              {step.data.output.exit_code}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Preview when not expanded */}
                      {!isExpanded && step.data.output?.stdout && (
                        <div className="mt-3 text-xs text-gray-600 bg-gray-100 rounded-lg p-3 max-h-16 overflow-hidden">
                          {step.data.output.stdout.slice(0, 120)}
                          {step.data.output.stdout.length > 120 && '...'}
                        </div>
                      )}
                    </div>

                    {/* Expanded Job Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-4 space-y-4">
                          {/* Job Metadata */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-gray-500 mb-1">Job ID</div>
                              <div className="font-mono text-gray-900 truncate">{step.data.job_id}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <div className="text-gray-500 mb-1">Status</div>
                              <div className={`font-medium ${
                                isFailed ? 'text-red-600' : 
                                isCompleted ? 'text-green-600' : 
                                'text-yellow-600'
                              }`}>
                                {step.data.status?.toUpperCase()}
                              </div>
                            </div>
                            {step.data.output?.language && (
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500 mb-1">Language</div>
                                <div className="font-medium text-blue-600">{step.data.output.language}</div>
                              </div>
                            )}
                            {step.data.output?.exit_code !== undefined && (
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500 mb-1">Exit Code</div>
                                <div className={`font-bold ${step.data.output.exit_code === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {step.data.output.exit_code}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Job Details */}
                          <div className="space-y-2">
                            {step.data.output?.stdout && (
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500 text-xs mb-2 flex items-center">
                                  <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Output Preview
                                </div>
                                <div className="text-xs font-mono text-gray-700 bg-gray-100 rounded p-2 max-h-24 overflow-y-auto">
                                  {step.data.output.stdout.slice(0, 300)}
                                  {step.data.output.stdout.length > 300 && '\n... (click to view full output)'}
                                </div>
                              </div>
                            )}
                            
                            {step.data.output?.stderr && (
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-gray-500 text-xs mb-2 flex items-center">
                                  <svg className="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  Error Output
                                </div>
                                <div className="text-xs font-mono text-red-700 bg-red-50 rounded p-2 max-h-24 overflow-y-auto">
                                  {step.data.output.stderr.slice(0, 300)}
                                  {step.data.output.stderr.length > 300 && '\n... (click to view full output)'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-2">
                            <button 
                              onClick={() => setCurrentJobIndex(index)}
                              className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Full Output
                            </button>
                            {step.data.output?.stdout && (
                              <button 
                                onClick={() => navigator.clipboard.writeText(step.data.output?.stdout || '')}
                                className="bg-gray-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                Copy
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {steps.filter(step => step.data.job_id).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">No Jobs Yet</h3>
                  <p className="text-sm text-gray-500">Waiting for execution...</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle - Real-time Timeline */}
          <div className="w-96 border-r">
            <WorkflowTimeline steps={steps} isExecuting={isExecuting} />
          </div>

          {/* Right Side - Full Output Display */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="p-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-sm font-semibold text-white">
                  {steps.filter(step => step.data.job_id)[currentJobIndex] ? 
                    `${steps.filter(step => step.data.job_id)[currentJobIndex].data.job_label || steps.filter(step => step.data.job_id)[currentJobIndex].data.job_id} - Output` :
                    'Terminal Output'
                  }
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isExecuting ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {isExecuting ? 'LIVE' : 'COMPLETED'}
                </span>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentJobIndex(Math.max(0, currentJobIndex - 1))}
                    disabled={currentJobIndex === 0}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <span className="text-xs text-gray-400 px-2">
                    {currentJobIndex + 1} / {steps.filter(step => step.data.job_id).length}
                  </span>
                  
                  <button
                    onClick={() => setCurrentJobIndex(Math.min(steps.filter(step => step.data.job_id).length - 1, currentJobIndex + 1))}
                    disabled={currentJobIndex >= steps.filter(step => step.data.job_id).length - 1}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto text-green-400 font-mono text-sm p-4 leading-relaxed">
              {steps.filter(step => step.data.job_id)[currentJobIndex] ? (
                (() => {
                  const currentStep = steps.filter(step => step.data.job_id)[currentJobIndex];
                  return (
                    <div className="space-y-6">
                      {/* Enhanced Job Header */}
                      <div className="border-b border-gray-700 pb-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-cyan-400 text-xl font-bold flex items-center">
                            <span className="mr-3">🚀</span>
                            {currentStep.data.job_label || currentStep.data.job_id}
                          </div>
                          <div className="flex items-center space-x-3">
                            {currentStep.data.status === 'completed' ? (
                              <span className="flex items-center text-green-400 bg-green-900 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                COMPLETED
                              </span>
                            ) : currentStep.data.status === 'failed' ? (
                              <span className="flex items-center text-red-400 bg-red-900 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                FAILED
                              </span>
                            ) : (
                              <span className="flex items-center text-yellow-400 bg-yellow-900 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                EXECUTING
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div className="text-gray-400 text-xs mb-1">Job Type</div>
                            <div className="text-blue-400 font-semibold">{currentStep.data.job_type || 'Unknown'}</div>
                          </div>
                          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div className="text-gray-400 text-xs mb-1">Start Time</div>
                            <div className="text-yellow-400 font-semibold">{currentStep.timestamp?.slice(11, 19) || 'N/A'}</div>
                          </div>
                          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div className="text-gray-400 text-xs mb-1">Exit Code</div>
                            <div className={`font-bold ${currentStep.data.output?.exit_code === 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {currentStep.data.output?.exit_code !== undefined ? currentStep.data.output.exit_code : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div className="text-gray-400 text-xs mb-1">Language/Runtime</div>
                            <div className="text-purple-400 font-semibold">
                              {currentStep.data.output?.language || 'System'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* STDOUT Output with enhanced formatting */}
                      {currentStep.data.output?.stdout && (
                        <div className="mb-6">
                          <div className="text-green-400 font-bold mb-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              STANDARD OUTPUT:
                            </div>
                            <div className="text-xs text-gray-400 flex items-center">
                              <span className="mr-2">📄 {currentStep.data.output.stdout.split('\n').length} lines</span>
                              <span>📊 {currentStep.data.output.stdout.length} chars</span>
                            </div>
                          </div>
                          <div className="bg-gray-900 bg-opacity-70 rounded-lg p-5 border-l-4 border-green-500 max-h-96 overflow-y-auto">
                            <pre className="text-green-300 whitespace-pre-wrap leading-relaxed text-base">
{currentStep.data.output.stdout}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* STDERR Output with enhanced formatting */}
                      {currentStep.data.output?.stderr && (
                        <div className="mb-6">
                          <div className="text-red-400 font-bold mb-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ERROR OUTPUT:
                            </div>
                            <div className="text-xs text-gray-400 flex items-center">
                              <span className="mr-2">⚠️ {currentStep.data.output.stderr.split('\n').length} lines</span>
                              <span>📊 {currentStep.data.output.stderr.length} chars</span>
                            </div>
                          </div>
                          <div className="bg-red-900 bg-opacity-30 rounded-lg p-5 border-l-4 border-red-500 max-h-96 overflow-y-auto">
                            <pre className="text-red-300 whitespace-pre-wrap leading-relaxed text-base">
{currentStep.data.output.stderr}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Application Error */}
                      {currentStep.data.error && (
                        <div className="mb-6">
                          <div className="text-red-400 font-bold mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            APPLICATION ERROR:
                          </div>
                          <div className="bg-red-900 bg-opacity-40 rounded-lg p-5 border-l-4 border-red-500">
                            <div className="text-red-200 text-base leading-relaxed">{currentStep.data.error}</div>
                          </div>
                        </div>
                      )}

                      {/* Command Footer */}
                      <div className="border-t border-gray-700 pt-4 mt-8">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <div className="flex items-center space-x-6">
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                              Job ID: {currentStep.data.job_id}
                            </span>
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Event: {currentStep.event_type}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => navigator.clipboard.writeText(currentStep.data.output?.stdout || '')}
                              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                              📋 Copy Output
                            </button>
                            <span className="text-gray-500">
                              Last updated: {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Output Available</h3>
                    <p className="text-gray-600">Select a job from the left panel to view its output</p>
                  </div>
                  
                  <div className="text-blue-400 mt-6">
                    $ workflow-executor --id={executionId}
                  </div>
                  <div className="animate-pulse mt-2">
                    <span className="text-white">█</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
