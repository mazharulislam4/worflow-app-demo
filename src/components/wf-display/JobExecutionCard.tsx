'use client';

import { useEffect, useState } from 'react';

export interface JobStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  output?: string;
  logs?: string[];
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
    details?: string[];
    message?: string;
    result?: string;
  };
  timestamp: string;
}

interface JobExecutionCardProps {
  step: JobStep;
  isActive: boolean;
  isCompleted: boolean;
}

export default function JobExecutionCard({ step, isActive, isCompleted }: JobExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive && !isCompleted) {
      const interval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 2 : prev);
      }, 200);
      return () => clearInterval(interval);
    } else if (isCompleted) {
      setProgress(100);
    }
  }, [isActive, isCompleted]);

  const getStatusIcon = () => {
    if (step.data.status === 'failed' || step.data.error) {
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    } else if (isCompleted) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (isActive) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
        </div>
      );
    }
  };

  const getStatusColor = () => {
    if (step.data.status === 'failed' || step.data.error) return 'border-red-200 bg-red-50';
    if (isCompleted) return 'border-green-200 bg-green-50';
    if (isActive) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getJobTypeIcon = (jobType?: string) => {
    switch (jobType?.toLowerCase()) {
      case 'script':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'apicall':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        );
      case 'start':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'end':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const formatOutput = (output: unknown) => {
    if (!output) return null;
    if (typeof output === 'string') return output;
    if (typeof output === 'object') {
      return JSON.stringify(output, null, 2);
    }
    return String(output);
  };

  const hasOutput = () => {
    return step.data.result || step.data.output || step.data.details?.length;
  };

  return (
    <div className={`rounded-lg border-2 transition-all duration-300 ${getStatusColor()}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="flex items-center space-x-2">
              {getJobTypeIcon(step.data.job_type)}
              <div>
                <h4 className="font-medium text-gray-900">
                  {step.data.job_label || step.data.job_id || 'Unknown Job'}
                </h4>
                <p className="text-sm text-gray-500">
                  {step.data.job_type} • {step.timestamp.slice(11, 19)}
                </p>
              </div>
            </div>
          </div>
          
          {hasOutput() && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {isActive && !isCompleted && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {step.data.message && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            {step.data.message}
          </div>
        )}

        {/* Error Message */}
        {step.data.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <div className="font-medium">Error:</div>
            <div className="mt-1">{step.data.error}</div>
          </div>
        )}

        {/* Expandable Output */}
        {isExpanded && hasOutput() && (
          <div className="mt-3 border-t pt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Output:</h5>
            
            {/* Details */}
                        {step.data.details && Array.isArray(step.data.details) && step.data.details.length > 0 && (
              <div className="mb-3">
                <h6 className="text-xs font-medium text-gray-600 mb-1">Details:</h6>
                <div className="space-y-1">
                  {step.data.details.map((detail: string, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result/Output */}
            {(step.data.result || step.data.output) && (
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                <pre>{formatOutput(step.data.result || step.data.output)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
