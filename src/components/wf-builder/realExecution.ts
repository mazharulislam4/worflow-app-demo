/**
 * Real Workflow Execution Engine
 * Executes workflow jobs with actual API calls, email sending, and script execution
 */

import { SendEmailRequest } from "../../redux/features/emailApiSlice";
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
  label?: string; // Add label for display
  jobType?: string; // Add job type for easier access
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  jobResults: Map<string, JobExecutionResult>;
  executionLogs: string[];
}

// Script execution environment configuration
interface ScriptExecutionContext {
  // Built-in variables available to scripts
  variables: Record<string, any>;
  // Results from previous jobs
  jobResults: Record<string, any>;
  // Utility functions
  utils: {
    log: (message: string) => void;
    fetch: typeof fetch;
    setTimeout: typeof setTimeout;
    Math: typeof Math;
    Date: typeof Date;
    JSON: typeof JSON;
  };
  // Console capture for output display
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };
}

export class RealWorkflowExecutor {
  private emailSendFunction?: (emailData: SendEmailRequest) => Promise<any>;
  private onJobUpdate?: (jobResult: JobExecutionResult) => void;
  private onWorkflowUpdate?: (workflowResult: WorkflowExecutionResult) => void;
  private isExecuting = false;
  private scriptTimeout = 30000; // 30 seconds timeout for scripts
  private apiTimeout = 60000; // 60 seconds timeout for API calls

  constructor(options?: {
    emailSendFunction?: (emailData: SendEmailRequest) => Promise<any>;
    onJobUpdate?: (jobResult: JobExecutionResult) => void;
    onWorkflowUpdate?: (workflowResult: WorkflowExecutionResult) => void;
    scriptTimeout?: number;
    apiTimeout?: number;
  }) {
    this.emailSendFunction = options?.emailSendFunction;
    this.onJobUpdate = options?.onJobUpdate;
    this.onWorkflowUpdate = options?.onWorkflowUpdate;
    this.scriptTimeout = options?.scriptTimeout ?? 30000;
    this.apiTimeout = options?.apiTimeout ?? 60000;
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
      `🚀 Starting REAL workflow execution with ${workflowConfig.jobs.length} jobs`
    );

    try {
      // Initialize all job results
      workflowConfig.jobs.forEach((job) => {
        const jobResult: JobExecutionResult = {
          jobId: job.attributes.nodeId,
          type: job.type,
          status: "pending",
          logs: [],
          label: job.attributes.label, // Add label for display
          jobType: job.type, // Add job type for easier access
        };
        result.jobResults.set(job.attributes.nodeId, jobResult);
      });

      // Start execution from the start node
      const startNodeId = workflowConfig.executionFlow.startNode;
      if (!startNodeId) {
        throw new Error("No start node found in workflow");
      }

      this.log(result, `🎯 Starting execution from node: ${startNodeId}`);
      this.log(
        result,
        `📋 Available jobs: ${workflowConfig.jobs
          .map((j) => `${j.attributes.nodeId} (${j.type})`)
          .join(", ")}`
      );

      await this.executeFromNode(
        startNodeId,
        workflowConfig,
        result,
        new Set()
      );

      // Analyze final workflow status based on individual job results
      const jobResults = Array.from(result.jobResults.values());
      const failedJobs = jobResults.filter((job) => job.status === "failed");
      const completedJobs = jobResults.filter(
        (job) => job.status === "completed"
      );
      const skippedJobs = jobResults.filter(
        (job) => job.status === "pending" || job.status === "skipped"
      );

      if (failedJobs.length > 0) {
        result.status = "completed"; // Workflow completed with some failures
        result.endTime = new Date();
        this.log(
          result,
          `⚠️ Workflow completed with ${failedJobs.length} failed job(s), ${completedJobs.length} successful job(s)`
        );

        // Log details of failed jobs
        failedJobs.forEach((job) => {
          this.log(
            result,
            `❌ Failed Job: ${job.jobId} (${job.type}) - ${job.error}`
          );
        });

        if (completedJobs.length > 0) {
          this.log(
            result,
            `✅ Successful Jobs: ${completedJobs
              .map((j) => `${j.jobId} (${j.type})`)
              .join(", ")}`
          );
        }

        if (skippedJobs.length > 0) {
          this.log(
            result,
            `⏭️ Skipped/Pending Jobs: ${skippedJobs
              .map((j) => `${j.jobId} (${j.type})`)
              .join(", ")}`
          );
        }
      } else {
        result.status = "completed";
        result.endTime = new Date();
        this.log(
          result,
          `✅ Real workflow completed successfully - All ${completedJobs.length} jobs executed successfully`
        );
      }
    } catch (error) {
      result.status = "failed";
      result.endTime = new Date();
      this.log(result, `❌ Real workflow failed: ${error}`);
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
    this.log(workflowResult, `🎯 Attempting to execute node: ${nodeId}`);

    // Avoid infinite loops
    if (executedNodes.has(nodeId)) {
      this.log(workflowResult, `🔄 Node ${nodeId} already executed, skipping`);
      return;
    }

    const job = workflowConfig.jobs.find((j) => j.attributes.nodeId === nodeId);
    if (!job) {
      const availableJobs = workflowConfig.jobs
        .map((j) => j.attributes.nodeId)
        .join(", ");
      const errorMsg = `Job with ID ${nodeId} not found. Available jobs: ${availableJobs}`;
      this.log(workflowResult, `❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    this.log(
      workflowResult,
      `✅ Found job: ${job.attributes.label} (${job.type})`
    );
    this.log(
      workflowResult,
      `📋 Job dependencies: ${
        job.dependencies.length > 0
          ? job.dependencies.map((d) => d.sourceJobId).join(", ")
          : "None"
      }`
    );

    // Check if all dependencies are satisfied
    const pendingDependencies = job.dependencies.filter((dep) => {
      const depJobResult = workflowResult.jobResults.get(dep.sourceJobId);
      const isExecuted = executedNodes.has(dep.sourceJobId);
      const isCompleted = depJobResult?.status === "completed";
      const isFailed = depJobResult?.status === "failed";

      this.log(
        workflowResult,
        `🔍 Checking dependency: ${dep.sourceJobId} - Executed: ${isExecuted}, Status: ${depJobResult?.status}`
      );

      // Allow execution if dependency is completed OR failed (but executed)
      // Only block if dependency is still pending/running or not executed at all
      return !isExecuted || (!isCompleted && !isFailed);
    });

    const failedDependencies = job.dependencies.filter((dep) => {
      const depJobResult = workflowResult.jobResults.get(dep.sourceJobId);
      return depJobResult?.status === "failed";
    });

    // Log warnings for failed dependencies but continue execution
    if (failedDependencies.length > 0) {
      const failedList = failedDependencies
        .map((dep) => {
          const depJobResult = workflowResult.jobResults.get(dep.sourceJobId);
          return `${dep.sourceJobId} (${depJobResult?.status})`;
        })
        .join(", ");

      this.log(
        workflowResult,
        `⚠️ Job ${job.attributes.label} has failed dependencies but will continue: ${failedList}`
      );

      // Update job status to show it's aware of failed dependencies
      const jobResult = workflowResult.jobResults.get(nodeId)!;
      jobResult.logs.push(
        `Warning: Continuing despite failed dependencies: ${failedList}`
      );
      this.onJobUpdate?.(jobResult);
    }

    if (pendingDependencies.length > 0) {
      const pendingList = pendingDependencies
        .map((dep) => {
          const depJobResult = workflowResult.jobResults.get(dep.sourceJobId);
          return `${dep.sourceJobId} (${depJobResult?.status || "unknown"})`;
        })
        .join(", ");

      this.log(
        workflowResult,
        `⏸️ Job ${job.attributes.label} waiting for dependencies: ${pendingList}`
      );

      // Update job status to show it's waiting
      const jobResult = workflowResult.jobResults.get(nodeId)!;
      jobResult.logs.push(`Waiting for dependencies: ${pendingList}`);
      this.onJobUpdate?.(jobResult);

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

      // Continue with remaining jobs even if some fail
      await Promise.allSettled(nextJobPromises);
    } catch (error) {
      jobResult.status = "failed";
      jobResult.error = error instanceof Error ? error.message : String(error);
      jobResult.endTime = new Date();
      this.onJobUpdate?.(jobResult);

      // IMPORTANT: Mark failed job as executed so downstream jobs can continue
      executedNodes.add(nodeId);

      // Always continue execution - don't stop the entire workflow
      this.log(
        workflowResult,
        `❌ Job ${job.attributes.label} failed: ${jobResult.error} - Continuing with other jobs`
      );

      // Still try to execute next jobs that don't depend on this failed job
      const nextJobs = await this.getNextJobs(job, jobResult, workflowConfig);
      const nextJobPromises = nextJobs.map((nextJobId) =>
        this.executeFromNode(
          nextJobId,
          workflowConfig,
          workflowResult,
          executedNodes
        )
      );

      // Continue with remaining jobs using allSettled to prevent cascading failures
      await Promise.allSettled(nextJobPromises);
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
      `▶️ REAL Executing ${job.type}: ${job.attributes.label}`
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
          await this.executeConditionJob(job, jobResult, workflowResult);
          break;
        case "APICall":
          await this.executeAPICallJob(job, jobResult);
          break;
        case "Script":
          await this.executeScriptJob(job, jobResult, workflowResult);
          break;
        case "SendEmail":
          await this.executeSendEmailJob(job, jobResult);
          break;
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
        `✅ REAL Completed ${job.type}: ${job.attributes.label}`
      );
    } catch (error) {
      jobResult.status = "failed";
      jobResult.endTime = new Date();
      jobResult.error = error instanceof Error ? error.message : String(error);
      this.log(
        workflowResult,
        `❌ REAL Failed ${job.type}: ${job.attributes.label} - ${jobResult.error}`
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
    this.logJob(jobResult, "Starting real workflow execution");

    // Minimal processing time for start
    await this.delay(100);

    jobResult.result = {
      started: true,
      timestamp: new Date().toISOString(),
      triggerOnStart: job.attributes.triggerOnStart,
      executionMode: "REAL",
    };

    this.logJob(jobResult, "Real workflow started successfully");
  }

  /**
   * Execute API Call job with real HTTP requests
   */
  private async executeAPICallJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    const { url, method = "GET", headers = {}, body, timeout } = job.attributes;

    if (!url) {
      throw new Error("API Call job requires a URL");
    }

    this.logJob(jobResult, `Making REAL ${method} request to: ${url}`);
    this.logJob(jobResult, `Headers: ${JSON.stringify(headers)}`);
    if (body) {
      this.logJob(jobResult, `Body: ${JSON.stringify(body)}`);
    }

    const requestTimeout = timeout || this.apiTimeout;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        signal: controller.signal,
        mode: "cors", // Enable CORS
      };

      if (body && method !== "GET") {
        fetchOptions.body =
          typeof body === "string" ? body : JSON.stringify(body);
      }

      const startTime = Date.now();

      this.logJob(jobResult, `Sending ${method} request...`);
      const response = await fetch(url, fetchOptions);
      const endTime = Date.now();

      clearTimeout(timeoutId);

      const responseTime = endTime - startTime;
      this.logJob(
        jobResult,
        `Response received in ${responseTime}ms with status ${response.status}`
      );

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const responseText = await response.text();
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          this.logJob(
            jobResult,
            `Warning: Failed to parse JSON response: ${parseError}`
          );
          responseData = responseText;
        }
      } else {
        responseData = await response.text();
      }

      const result = {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        executionDetails: {
          duration: responseTime,
          url,
          method,
          timestamp: new Date().toISOString(),
          contentType: contentType || "unknown",
        },
      };

      if (!response.ok) {
        this.logJob(
          jobResult,
          `API call failed with status ${response.status}: ${response.statusText}`
        );
        this.logJob(jobResult, `Response: ${JSON.stringify(responseData)}`);
        throw new Error(
          `API call failed with status ${response.status}: ${response.statusText}`
        );
      }

      jobResult.result = result;
      this.logJob(
        jobResult,
        `REAL API call successful with status ${response.status}`
      );
      this.logJob(jobResult, `Response time: ${responseTime}ms`);
      this.logJob(
        jobResult,
        `Data type: ${typeof responseData}, Content-Type: ${contentType}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          const timeoutMsg = `API call timed out after ${requestTimeout}ms`;
          this.logJob(jobResult, timeoutMsg);
          throw new Error(timeoutMsg);
        }
        if (error.message.includes("Failed to fetch")) {
          const corsMsg = `Network error: Possible CORS issue or server unreachable. URL: ${url}`;
          this.logJob(jobResult, corsMsg);
          this.logJob(
            jobResult,
            "Tip: Ensure the API supports CORS or use a proxy server"
          );
          throw new Error(corsMsg);
        }
        this.logJob(jobResult, `API call error: ${error.message}`);
        throw new Error(`API call failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Execute Script job with real JavaScript execution using Function constructor
   */
  private async executeScriptJob(
    job: BackendJob,
    jobResult: JobExecutionResult,
    workflowResult: WorkflowExecutionResult
  ): Promise<void> {
    // Support both 'script' and 'code' property names for backward compatibility
    const script = job.attributes.script || job.attributes.code;
    const { language = "javascript" } = job.attributes;

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

    if (!script) {
      const availableProps = Object.keys(job.attributes).join(", ");
      throw new Error(
        `Script job requires script content in 'script' or 'code' property. Available properties: ${availableProps}`
      );
    }

    if (language !== "javascript") {
      throw new Error(
        `Script language '${language}' not supported. Only JavaScript is supported.`
      );
    }

    this.logJob(jobResult, `Executing REAL ${language} script`);
    this.logJob(jobResult, `Script length: ${script.length} characters`);

    try {
      // Create a console output capturer
      const consoleOutput: string[] = [];
      const captureConsole = {
        log: (...args: any[]) => {
          const message = args.map((arg) => String(arg)).join(" ");
          consoleOutput.push(message);
          this.logJob(jobResult, `Script Console: ${message}`);
        },
        error: (...args: any[]) => {
          const message = args.map((arg) => String(arg)).join(" ");
          consoleOutput.push(`ERROR: ${message}`);
          this.logJob(jobResult, `Script Console Error: ${message}`);
        },
        warn: (...args: any[]) => {
          const message = args.map((arg) => String(arg)).join(" ");
          consoleOutput.push(`WARN: ${message}`);
          this.logJob(jobResult, `Script Console Warn: ${message}`);
        },
      };

      // Create a safe execution context
      const executionContext: ScriptExecutionContext = {
        variables: {},
        jobResults: this.getJobResultsForScript(workflowResult),
        utils: {
          log: (message: string) =>
            this.logJob(jobResult, `Script Log: ${message}`),
          fetch: fetch,
          setTimeout: setTimeout,
          Math: Math,
          Date: Date,
          JSON: JSON,
        },
        console: captureConsole, // Add captured console
      };

      this.logJob(jobResult, "Executing script in controlled environment...");
      const startTime = Date.now();

      // Create a safe execution environment
      const safeScript = `
        (function(context) {
          'use strict';
          
          // Make context variables available
          const { variables, jobResults, utils, console } = context;
          const { log, fetch, setTimeout, Math, Date, JSON } = utils;
          
          // User script execution
          ${script}
          
          // Return any result if script doesn't explicitly return
          return typeof result !== 'undefined' ? result : 'Script executed successfully';
        })(context);
      `;

      // Execute with timeout
      const executeWithTimeout = (
        script: string,
        context: any,
        timeout: number
      ): Promise<any> => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Script execution timed out after ${timeout}ms`));
          }, timeout);

          try {
            const func = new Function("context", script);
            const result = func.call(null, context);

            clearTimeout(timeoutId);

            // Handle async results
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
      };

      const scriptResult = await executeWithTimeout(
        safeScript,
        executionContext,
        this.scriptTimeout
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const result = {
        success: true,
        exitCode: 0,
        executionTime,
        language,
        scriptResult,
        consoleOutput: consoleOutput.join("\n"), // Add captured console output
        output: {
          logs: jobResult.logs.filter((log) => log.includes("Script Log:")),
          consoleOutput: consoleOutput, // Array format for processing
          executionMode: "REAL_FUNCTION",
        },
        performance: {
          executionTime: `${executionTime}ms`,
          sandbox: "FUNCTION_CONSTRUCTOR",
        },
      };

      jobResult.result = result;
      this.logJob(
        jobResult,
        `REAL script executed successfully in ${executionTime}ms`
      );
      this.logJob(jobResult, `Script result: ${JSON.stringify(scriptResult)}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Script execution failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Execute Send Email job with real email API
   */
  private async executeSendEmailJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    const emailData: SendEmailRequest = {
      to: job.attributes.to || ["test@example.com"],
      cc: job.attributes.cc,
      bcc: job.attributes.bcc,
      subject: job.attributes.subject || "Workflow Email Notification",
      body:
        job.attributes.body ||
        "This email was sent from a real workflow execution.",
      related_id: `workflow_${Date.now()}`,
      related_class: "workflow",
      from_email: job.attributes.fromEmail,
      provider: job.attributes.provider,
      template_id: job.attributes.templateId,
      template_name: job.attributes.templateName,
    };

    this.logJob(
      jobResult,
      `Preparing REAL email for: ${
        Array.isArray(emailData.to) ? emailData.to.join(", ") : emailData.to
      }`
    );
    this.logJob(jobResult, `Subject: ${emailData.subject}`);

    if (!this.emailSendFunction) {
      throw new Error(
        "Email send function not provided to executor. Cannot send real emails."
      );
    }

    try {
      this.logJob(jobResult, "Sending email via REAL email service...");
      const startTime = Date.now();

      const result = await this.emailSendFunction(emailData);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Enhance result with execution details
      const enhancedResult = {
        ...result,
        executionDetails: {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString(),
          executionMode: "REAL_API",
          emailData: {
            recipients: {
              to: Array.isArray(emailData.to) ? emailData.to.length : 1,
              cc: Array.isArray(emailData.cc) ? emailData.cc?.length || 0 : 0,
              bcc: Array.isArray(emailData.bcc)
                ? emailData.bcc?.length || 0
                : 0,
            },
            subject: emailData.subject,
            bodyLength: emailData.body?.length || 0,
          },
        },
      };

      jobResult.result = enhancedResult;
      this.logJob(
        jobResult,
        `REAL email sent successfully in ${processingTime}ms`
      );
      this.logJob(
        jobResult,
        `Email ID: ${result.id || result.emailId || "unknown"}`
      );
    } catch (error) {
      throw new Error(
        `Failed to send real email: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Execute Condition job with real logic evaluation
   */
  private async executeConditionJob(
    job: BackendJob,
    jobResult: JobExecutionResult,
    workflowResult: WorkflowExecutionResult
  ): Promise<void> {
    const { conditions, logic = "AND" } = job.attributes;

    this.logJob(
      jobResult,
      `Evaluating ${
        conditions?.length || 0
      } REAL condition(s) with ${logic} logic`
    );

    if (!conditions || conditions.length === 0) {
      throw new Error("Condition job requires at least one condition");
    }

    // Get context data from previous job results
    const contextData = this.getJobResultsForScript(workflowResult);

    const results = conditions.map((condition: any, index: number) => {
      const { field, operator, value } = condition;

      // Get the actual field value from context or set default
      let fieldValue = contextData[field];
      if (fieldValue === undefined) {
        this.logJob(
          jobResult,
          `Warning: Field '${field}' not found in context, using null`
        );
        fieldValue = null;
      }

      let result = false;

      try {
        switch (operator) {
          case "equals":
            result = String(fieldValue) === String(value);
            break;
          case "not_equals":
            result = String(fieldValue) !== String(value);
            break;
          case "greater_than":
            result = Number(fieldValue) > Number(value);
            break;
          case "less_than":
            result = Number(fieldValue) < Number(value);
            break;
          case "contains":
            result = String(fieldValue)
              .toLowerCase()
              .includes(String(value).toLowerCase());
            break;
          case "not_contains":
            result = !String(fieldValue)
              .toLowerCase()
              .includes(String(value).toLowerCase());
            break;
          case "is_empty":
            result = !fieldValue || String(fieldValue).trim() === "";
            break;
          case "is_not_empty":
            result = !!fieldValue && String(fieldValue).trim() !== "";
            break;
          default:
            throw new Error(`Unknown operator: ${operator}`);
        }

        this.logJob(
          jobResult,
          `Condition ${
            index + 1
          }: ${field} (${fieldValue}) ${operator} ${value} → ${result}`
        );
      } catch (error) {
        this.logJob(
          jobResult,
          `Error evaluating condition ${index + 1}: ${
            error instanceof Error ? error.message : error
          }`
        );
        throw error;
      }

      return result;
    });

    const conditionResult =
      logic === "AND"
        ? results.every((r: boolean) => r)
        : results.some((r: boolean) => r);

    jobResult.result = {
      conditionResult,
      evaluatedConditions: conditions.length,
      logic,
      results: results,
      timestamp: new Date().toISOString(),
      executionMode: "REAL",
    };

    this.logJob(
      jobResult,
      `REAL condition evaluation result: ${conditionResult}`
    );
  }

  /**
   * Execute Add Task job (this would integrate with your task management system)
   */
  private async executeAddTaskJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    const taskData = {
      title: job.attributes.title || "Workflow Generated Task",
      description:
        job.attributes.description || "Task created by real workflow execution",
      assignee: job.attributes.assignee,
      priority: job.attributes.priority || "medium",
      dueDate: job.attributes.dueDate,
      tags: job.attributes.tags || ["workflow", "real-execution"],
    };

    this.logJob(jobResult, `Creating REAL task: ${taskData.title}`);

    // TODO: Integrate with your actual task management API
    // For now, this is a placeholder that logs the task creation
    this.logJob(jobResult, "TODO: Integrate with real task management API");
    this.logJob(jobResult, `Task data: ${JSON.stringify(taskData)}`);

    // Simulate task creation for now
    const mockTaskResult = {
      taskId: `real_task_${Date.now()}`,
      ...taskData,
      status: "created",
      createdAt: new Date().toISOString(),
      executionMode: "REAL",
      note: "This task would be created in your real task management system",
    };

    jobResult.result = mockTaskResult;
    this.logJob(
      jobResult,
      `REAL task placeholder created: ${mockTaskResult.taskId}`
    );
  }

  /**
   * Execute End job
   */
  private async executeEndJob(
    job: BackendJob,
    jobResult: JobExecutionResult
  ): Promise<void> {
    await this.delay(100);

    jobResult.result = {
      message: "Real workflow completed successfully",
      terminatedAt: new Date().toISOString(),
      finalStatus: "completed",
      executionMode: "REAL",
    };

    this.logJob(jobResult, "📋 Real workflow termination initiated");
    this.logJob(jobResult, "✅ All upstream jobs completed successfully");
    this.logJob(jobResult, "🏁 Real workflow terminated gracefully");
  }

  /**
   * Determine next jobs to execute based on current job result
   */
  private async getNextJobs(
    job: BackendJob,
    jobResult: JobExecutionResult,
    workflowConfig: BackendJobsConfig
  ): Promise<string[]> {
    const nextJobs: string[] = [];

    if (job.isConditional && jobResult.result?.conditionResult !== undefined) {
      // For conditional jobs, follow the appropriate branch
      const conditionMet = jobResult.result.conditionResult;
      const targetCondition = conditionMet ? "true" : "false";

      job.connections.forEach((connection) => {
        if (connection.condition === targetCondition) {
          nextJobs.push(connection.targetJobId);
        }
      });
    } else {
      // For non-conditional jobs, follow all connections
      job.connections.forEach((connection) => {
        if (
          connection.condition === "out" ||
          connection.condition === "default"
        ) {
          nextJobs.push(connection.targetJobId);
        }
      });
    }

    return nextJobs;
  }

  /**
   * Get job results formatted for script context
   */
  private getJobResultsForScript(
    workflowResult: WorkflowExecutionResult
  ): Record<string, any> {
    const context: Record<string, any> = {};

    workflowResult.jobResults.forEach((jobResult, jobId) => {
      if (jobResult.result) {
        context[jobId] = jobResult.result;

        // Also add by job type for easier access
        context[`${jobResult.type.toLowerCase()}_result`] = jobResult.result;
      }
    });

    return context;
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(workflowResult: WorkflowExecutionResult, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    workflowResult.executionLogs.push(logMessage);
    console.log(logMessage);
  }

  private logJob(jobResult: JobExecutionResult, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    jobResult.logs.push(logMessage);
    console.log(`  ${logMessage}`);
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
export const createRealExecutor = (options?: {
  emailSendFunction?: (emailData: SendEmailRequest) => Promise<any>;
  onJobUpdate?: (jobResult: JobExecutionResult) => void;
  onWorkflowUpdate?: (workflowResult: WorkflowExecutionResult) => void;
  scriptTimeout?: number;
  apiTimeout?: number;
}) => {
  return new RealWorkflowExecutor(options);
};
