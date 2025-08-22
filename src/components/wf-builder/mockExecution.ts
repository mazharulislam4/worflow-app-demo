/**
 * Mock Workflow Execution Engine
 * Executes workflow jobs based on the exported JSON configuration
 */

import { BackendJob, BackendJobsConfig } from "./types";

// Execution result types
export interface JobExecutionResult {
  jobId: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  logs: string[];
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  jobResults: Map<string, JobExecutionResult>;
  executionLogs: string[];
}

export class MockWorkflowExecutor {
  // private emailSendFunction?: (emailData: any) => Promise<any>;
  private onJobUpdate?: (jobResult: JobExecutionResult) => void;
  private onWorkflowUpdate?: (workflowResult: WorkflowExecutionResult) => void;
  private isExecuting = false;

  constructor(options?: {
    // emailSendFunction?: (emailData: any) => Promise<any>;
    onJobUpdate?: (jobResult: JobExecutionResult) => void;
    onWorkflowUpdate?: (workflowResult: WorkflowExecutionResult) => void;
  }) {
    // this.emailSendFunction = options?.emailSendFunction;
    this.onJobUpdate = options?.onJobUpdate;
    this.onWorkflowUpdate = options?.onWorkflowUpdate;
  }

  /**
   * Execute the entire workflow
   */
  async executeWorkflow(
    workflowConfig: BackendJobsConfig
  ): Promise<WorkflowExecutionResult> {
    const workflowId = `workflow_${Date.now()}`;
    const result: WorkflowExecutionResult = {
      workflowId,
      status: "running",
      startTime: new Date(),
      jobResults: new Map(),
      executionLogs: [],
    };

    this.isExecuting = true;
    this.log(
      result,
      `🚀 Starting workflow execution with ${workflowConfig.jobs.length} jobs`
    );

    try {
      // Initialize all job results
      workflowConfig.jobs.forEach((job) => {
        const jobResult: JobExecutionResult = {
          jobId: job.attributes.nodeId,
          type: job.type,
          status: "pending",
          logs: [],
        };
        result.jobResults.set(job.attributes.nodeId, jobResult);
      });

      // Start execution from the start node
      const startNodeId = workflowConfig.executionFlow.startNode;
      if (!startNodeId) {
        throw new Error("No start node found in workflow");
      }

      await this.executeFromNode(
        startNodeId,
        workflowConfig,
        result,
        new Set()
      );

      result.status = "completed";
      result.endTime = new Date();
      this.log(result, `✅ Workflow completed successfully`);
    } catch (error) {
      result.status = "failed";
      result.endTime = new Date();
      this.log(result, `❌ Workflow failed: ${error}`);
      throw error;
    } finally {
      this.isExecuting = false;
      this.onWorkflowUpdate?.(result);
    }

    return result;
  }

  /**
   * Execute workflow starting from a specific node
   */
  private async executeFromNode(
    nodeId: string,
    workflowConfig: BackendJobsConfig,
    workflowResult: WorkflowExecutionResult,
    executedNodes: Set<string>
  ): Promise<void> {
    // Avoid infinite loops
    if (executedNodes.has(nodeId)) {
      return;
    }

    const job = workflowConfig.jobs.find((j) => j.attributes.nodeId === nodeId);
    if (!job) {
      throw new Error(`Job with ID ${nodeId} not found`);
    }

    // Check if all dependencies are satisfied
    const allDependenciesMet = job.dependencies.every((dep) =>
      executedNodes.has(dep.sourceJobId)
    );

    if (!allDependenciesMet) {
      this.log(
        workflowResult,
        `⏸️ Job ${job.attributes.label} waiting for dependencies`
      );
      return;
    }

    // Execute the job
    const jobResult = workflowResult.jobResults.get(nodeId)!;
    try {
      await this.executeJob(job, jobResult, workflowResult);
      executedNodes.add(nodeId);

      // Determine next jobs to execute
      const nextJobs = await this.getNextJobs(job, jobResult, workflowConfig);

      // Execute next jobs (could be parallel execution)
      const nextJobPromises = nextJobs.map((nextJobId) =>
        this.executeFromNode(
          nextJobId,
          workflowConfig,
          workflowResult,
          executedNodes
        )
      );

      await Promise.all(nextJobPromises);
    } catch (error) {
      jobResult.status = "failed";
      jobResult.error = error instanceof Error ? error.message : String(error);
      this.onJobUpdate?.(jobResult);

      if (!job.attributes.continueOnError) {
        throw error;
      } else {
        this.log(
          workflowResult,
          `⚠️ Job ${job.attributes.label} failed but continuing due to continueOnError flag`
        );
      }
    }
  }

  /**
   * Execute a single job based on its type
   */
  private async executeJob(
    job: BackendJob,
    jobResult: JobExecutionResult,
    workflowResult: WorkflowExecutionResult
  ): Promise<void> {
    jobResult.status = "running";
    jobResult.startTime = new Date();
    this.log(
      workflowResult,
      `▶️ Executing ${job.type}: ${job.attributes.label}`
    );
    this.onJobUpdate?.(jobResult);

    try {
      switch (job.type) {
        case "Start":
          await this.executeStartJob(job, jobResult);
          break;
        case "AddTask":
          await this.executeAddTaskJob(job, jobResult);
          break;
        case "Condition":
          await this.executeConditionJob(job, jobResult);
          break;
        case "APICall":
          await this.executeAPICallJob(job, jobResult);
          break;
        case "Script":
          await this.executeScriptJob(job, jobResult);
          break;
        // case "SendEmail":
        //   await this.executeSendEmailJob(job, jobResult);
        //   break;
        case "End":
          await this.executeEndJob(job, jobResult);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      jobResult.status = "completed";
      jobResult.endTime = new Date();
      this.log(
        workflowResult,
        `✅ Completed ${job.type}: ${job.attributes.label}`
      );
    } catch (error) {
      jobResult.status = "failed";
      jobResult.endTime = new Date();
      jobResult.error = error instanceof Error ? error.message : String(error);
      this.log(
        workflowResult,
        `❌ Failed ${job.type}: ${job.attributes.label} - ${jobResult.error}`
      );
      throw error;
    } finally {
      this.onJobUpdate?.(jobResult);
    }
  }

  /**
   * Execute Start job
   */
  private async executeStartJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    this.logJob(jobResult, "Starting workflow execution");

    // Simulate some processing time
    await this.delay(500);

    jobResult.result = {
      started: true,
      timestamp: new Date().toISOString(),
      triggerOnStart: job.attributes.triggerOnStart,
    };

    this.logJob(jobResult, "Workflow started successfully");
  }

  /**
   * Execute API Call job
   */
  private async executeAPICallJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    const { url, method, headers, body, timeout } = job.attributes;

    this.logJob(
      jobResult,
      `Making ${method} request to: ${url || "https://api.example.com/data"}`
    );
    this.logJob(jobResult, `Headers: ${JSON.stringify(headers || {})}`);

    // Simulate API call delay
    await this.delay(1000 + Math.random() * 2000);

    // Mock API response with more realistic data
    const mockResponse = {
      success: true,
      statusCode: 200,
      data: {
        id: Math.floor(Math.random() * 1000),
        message: "API call executed successfully",
        timestamp: new Date().toISOString(),
        requestMethod: method || "GET",
        requestUrl: url || "https://api.example.com/data",
        responseTime: Math.floor(Math.random() * 500) + 200 + "ms",
        payload: {
          userId: Math.floor(Math.random() * 100),
          sessionId: "sess_" + Math.random().toString(36).substr(2, 9),
          metadata: {
            source: "workflow_engine",
            version: "1.0.0",
            processed: true,
          },
        },
      },
      headers: {
        "content-type": "application/json",
        "x-response-time": Math.floor(Math.random() * 100) + "ms",
        "x-request-id": "req_" + Math.random().toString(36).substr(2, 9),
      },
      executionDetails: {
        duration: Math.floor(Math.random() * 2000) + 500,
        retryCount: 0,
        cacheHit: Math.random() > 0.7,
      },
    };

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error(
        `API call failed: ${
          Math.random() < 0.5
            ? "Network timeout after 30s"
            : "Server returned 500 Internal Server Error"
        }`
      );
    }

    jobResult.result = mockResponse;
    this.logJob(
      jobResult,
      `API call successful with status ${mockResponse.statusCode}`
    );
    this.logJob(jobResult, `Response time: ${mockResponse.data.responseTime}`);
  }

  /**
   * Execute Script job
   */
  private async executeScriptJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    // Support both 'script' and 'code' property names for backward compatibility
    const script = job.attributes.script || job.attributes.code;
    const { language } = job.attributes;

    // Debug logging
    this.logJob(
      jobResult,
      `🔍 Script job attributes: ${JSON.stringify(job.attributes)}`
    );
    this.logJob(jobResult, `📝 Script content found: ${script ? "YES" : "NO"}`);
    this.logJob(
      jobResult,
      `📝 Script length: ${script?.length || 0} characters`
    );

    this.logJob(jobResult, `Executing ${language || "javascript"} script`);
    this.logJob(
      jobResult,
      `Script content: ${script || "// No script provided"}`
    );

    if (!script) {
      const availableProps = Object.keys(job.attributes).join(", ");
      throw new Error(
        `Script job requires script content in 'script' or 'code' property. Available properties: ${availableProps}`
      );
    }

    // Simulate script execution time
    await this.delay(800 + Math.random() * 1500);

    // Mock script execution result with more detailed output
    const mockConsoleOutput = script
      ? [
          "Hello from script!",
          "Script execution started",
          "Processing data...",
          "Mock operation completed",
        ].join("\n")
      : "No console output";

    const mockResult = {
      success: true,
      exitCode: 0,
      executionTime: Math.floor(Math.random() * 1000) + 200,
      language: language || "javascript",
      script: script || "// No script provided",
      consoleOutput: mockConsoleOutput, // Add mock console output
      output: {
        stdout: script
          ? `Script executed successfully\n> ${script}\n< Result: Processing completed`
          : "No script provided - execution skipped",
        stderr: "",
        consoleOutput: mockConsoleOutput.split("\n"), // Array format
        logs: [
          "Script initialization started",
          "Environment variables loaded",
          "Executing user script...",
          "Script execution completed successfully",
        ],
      },
      variables: {
        scriptResult: Math.random() > 0.5 ? "success" : "processed",
        dataGenerated: Math.floor(Math.random() * 100),
        processingTime: Math.floor(Math.random() * 500) + "ms",
        memoryUsage: Math.floor(Math.random() * 50) + 25 + "MB",
      },
      performance: {
        cpuUsage: Math.floor(Math.random() * 30) + 10 + "%",
        memoryPeak: Math.floor(Math.random() * 100) + 50 + "MB",
        ioOperations: Math.floor(Math.random() * 20),
      },
    };

    // Simulate script failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(
        "Script execution failed: Syntax error or runtime exception"
      );
    }

    jobResult.result = mockResult;
    this.logJob(
      jobResult,
      `Script executed successfully in ${mockResult.executionTime}ms`
    );
    this.logJob(jobResult, `Mock console output: ${mockConsoleOutput}`);
    this.logJob(
      jobResult,
      `Memory usage: ${mockResult.performance.memoryPeak}`
    );
  }

  /**
   * Execute End job - workflow termination
   */
  private async executeEndJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    // Simulate processing time for end job
    await new Promise((resolve) => setTimeout(resolve, 500));

    jobResult.result = {
      message: "Workflow completed successfully",
      terminatedAt: new Date().toISOString(),
      finalStatus: "completed",
    };

    jobResult.logs.push("📋 Workflow termination initiated");
    jobResult.logs.push("🔍 Validating workflow completion");
    jobResult.logs.push("✅ All upstream jobs completed successfully");
    jobResult.logs.push("🏁 Workflow terminated gracefully");
  }

  /**
   * Cancel execution
   */
  public cancelExecution(): void {
    this.isExecuting = false;
  }

  public get isRunning(): boolean {
    return this.isExecuting;
  }
}

// Export utility functions
export const createMockExecutor = (options?: {
  // emailSendFunction?: (emailData: any) => Promise<any>;
  onJobUpdate?: (jobResult: JobExecutionResult) => void;
  onWorkflowUpdate?: (workflowResult: WorkflowExecutionResult) => void;
}) => {
  return new MockWorkflowExecutor(options);
};
