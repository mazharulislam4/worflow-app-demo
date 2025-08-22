import { useCallback, useEffect, useRef, useState } from 'react';

interface WorkflowMessage {
  type: string;
  job_id?: string;
  message?: string;
  timestamp?: string;
  execution_id?: string;
  status?: string;
  result?: unknown;
  error?: string;
  success?: boolean;
  progress?: number;
  total_jobs?: number;
  completed_jobs?: number;
  failed_jobs?: number;
  job_results?: Record<string, unknown>;
  completed_at?: string;
  failed_at?: string;
}

interface JobState {
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
}

interface UseWorkflowMonitorReturn {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  messages: WorkflowMessage[];
  jobs: Record<string, JobState>;
  executionStatus: WorkflowMessage | null;
  overallProgress: number;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

export const useWorkflowMonitor = (executionId: string | null): UseWorkflowMonitorReturn => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [jobs, setJobs] = useState<Record<string, JobState>>({});
  const [executionStatus, setExecutionStatus] = useState<WorkflowMessage | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const manualDisconnectRef = useRef(false);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!executionId) {
      console.log('No execution ID provided, cannot connect');
      return;
    }

    // Close existing connection if any
    if (websocketRef.current) {
      console.log('Closing existing WebSocket connection');
      manualDisconnectRef.current = true;
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Reset manual disconnect flag when connecting
    manualDisconnectRef.current = false;

    try {
      setConnectionStatus('connecting');
      
      // Use the WebSocket URL format that matches the backend routing
      let wsUrl: string;
      if (process.env.NODE_ENV === 'development') {
        wsUrl = `ws://localhost:8000/workflow/ws/execution/${executionId}/`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/workflow/ws/execution/${executionId}/`;
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      // Add a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection timeout');
          ws.close();
          setConnectionStatus('error');
        }
      }, 10000); // 10 second timeout
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        clearTimeout(connectionTimeout);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WorkflowMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          console.log('📋 Message type:', data.type, 'Job ID:', data.job_id);
          
          // Skip initial connection messages
          if (data.type === 'websocket_connected' || data.type === 'connection_established') {
            return;
          }
          
          // Add message to history
          setMessages(prev => {
            const newMessages = [...prev, data];
            console.log('📋 Total messages now:', newMessages.length);
            return newMessages;
          });
          
          // Handle different message types
          switch (data.type) {
            case 'job_started':
              if (data.job_id) {
                setJobs(prev => ({
                  ...prev,
                  [data.job_id!]: {
                    ...prev[data.job_id!],
                    status: 'running',
                    startedAt: data.timestamp
                  }
                }));
              }
              break;
            
            case 'job_progress':
              if (data.job_id) {
                setJobs(prev => ({
                  ...prev,
                  [data.job_id!]: {
                    ...prev[data.job_id!],
                    status: 'running',
                    progress: data.progress
                  }
                }));
              }
              break;
            
            case 'job_completed':
              if (data.job_id) {
                setJobs(prev => ({
                  ...prev,
                  [data.job_id!]: {
                    ...prev[data.job_id!],
                    status: 'completed',
                    result: data.result,
                    completedAt: data.timestamp,
                    progress: 100
                  }
                }));
              }
              break;
            
            case 'job_error':
            case 'job_failed':
              if (data.job_id) {
                setJobs(prev => ({
                  ...prev,
                  [data.job_id!]: {
                    ...prev[data.job_id!],
                    status: 'error',
                    error: data.error,
                    completedAt: data.timestamp
                  }
                }));
              }
              break;
            
            case 'execution_completed':
            case 'execution_failed':
              setExecutionStatus(data);
              
              // Calculate overall progress from the response data
              if (data.total_jobs && data.completed_jobs !== undefined) {
                const progress = (data.completed_jobs / data.total_jobs) * 100;
                setOverallProgress(progress);
              }
              break;
              
            default:
              console.log('Unhandled message type:', data.type);
          }
          
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket closed:', { 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean,
          wasManual: manualDisconnectRef.current 
        });
        
        setConnectionStatus('disconnected');
        
        // If it was a manual disconnect, don't try to reconnect
        if (manualDisconnectRef.current) {
          console.log('Manual disconnect, not reconnecting');
          return;
        }

        // Handle different close codes
        switch (event.code) {
          case 1000: // Normal closure
            console.log('WebSocket closed normally');
            break;
          case 1006: // Abnormal closure (connection failed)
            console.log('WebSocket connection failed - endpoint may not exist or server not configured for WebSockets');
            setConnectionStatus('error');
            // Don't try to reconnect for 1006 errors
            return;
          case 1001: // Going away
          case 1002: // Protocol error
          case 1003: // Unsupported data
            console.log('WebSocket closed with error code:', event.code);
            setConnectionStatus('error');
            break;
          default:
            console.log('WebSocket closed with code:', event.code);
        }

        // Only attempt reconnection if not a connection failure (1006) and within retry limits
        if (event.code !== 1006 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.log('Not attempting reconnection - either endpoint unavailable or max attempts reached');
          setConnectionStatus('error');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      websocketRef.current = ws;
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [executionId]); // Removed 'jobs' dependency to prevent infinite loop

  const disconnect = useCallback(() => {
    // Set manual disconnect flag to prevent reconnection
    manualDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Manual disconnect');
      websocketRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setJobs({});
    setExecutionStatus(null);
    setOverallProgress(0);
  }, []);

  // Auto-connect when executionId changes
  useEffect(() => {
    console.log('useWorkflowMonitor useEffect triggered:', { executionId });
    
    if (executionId) {
      clearMessages();
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      console.log('useWorkflowMonitor cleanup');
      disconnect();
    };
    // Only depend on executionId to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionId]);

  // Separate effect for calculating progress based on job states
  useEffect(() => {
    const totalJobs = Object.keys(jobs).length;
    if (totalJobs > 0) {
      const completedJobs = Object.values(jobs).filter(job => 
        job.status === 'completed' || job.status === 'error'
      ).length;
      const calculatedProgress = (completedJobs / totalJobs) * 100;
      
      // Only update if we don't have execution status progress or if local calculation is higher
      if (!executionStatus || calculatedProgress > overallProgress) {
        setOverallProgress(calculatedProgress);
      }
    }
  }, [jobs, executionStatus, overallProgress]);

  return {
    connectionStatus,
    messages,
    jobs,
    executionStatus,
    overallProgress,
    connect,
    disconnect,
    clearMessages
  };
};
