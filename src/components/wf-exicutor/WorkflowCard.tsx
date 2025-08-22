'use client';

import { useState } from 'react';

interface Job {
  type: string;
  attributes?: Record<string, unknown>;
}

interface WorkflowData {
  jobs?: Job[];
}

interface Workflow {
  id: number;
  name: string;
  description: string;
  workflow_data: WorkflowData;
}

interface WorkflowCardProps {
  workflow: Workflow;
  onExecute: (id: number) => void;
  isExecuting: boolean;
}

export default function WorkflowCard({ workflow, onExecute, isExecuting }: WorkflowCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getJobCount = () => {
    return workflow.workflow_data?.jobs?.length || 0;
  };

  const getJobTypes = (): string[] => {
    if (!workflow.workflow_data?.jobs) return [];
    return workflow.workflow_data.jobs
      .map((job: Job) => job.type)
      .filter((type: string, index: number, arr: string[]) => arr.indexOf(type) === index)
      .slice(0, 3);
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300
        ${isHovered ? 'shadow-xl scale-[1.02] border-blue-300' : 'hover:shadow-lg'}
        ${isExecuting ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{workflow.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{workflow.description}</p>
            </div>
          </div>
          
          {isExecuting && (
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Job Types Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {getJobTypes().map((type, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {type}
            </span>
          ))}
          {getJobCount() > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              +{getJobCount() - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {getJobCount()} jobs
          </span>
          <span className="text-xs text-gray-400">ID: {workflow.id}</span>
        </div>

        {/* Execute Button */}
        <button
          onClick={() => onExecute(workflow.id)}
          disabled={isExecuting}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
            ${isExecuting 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg transform hover:scale-[1.02]'
            }
          `}
        >
          {isExecuting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
              Executing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Execute Workflow
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
