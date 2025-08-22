import { JobStep } from "../../components/wf-exicutor/JobExecutionCard";
import { apiSlice } from "../apiSlice";

// Paginated response wrapper type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types for Service Categories
export interface ServiceCategory {
  id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types for Service Catalog
export interface ServiceCatalog {
  id?: number;
  sc_category: number;
  sc_category_detail?: ServiceCategory;
  name: string;
  description?: string;
  form_json?: Record<string, unknown>;
  wf_id: number;
  wf_detail?: {
    id: number;
    name: string;
    description: string;
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types for Workflows
export interface Workflow {
  id?: number;
  name: string;
  description?: string;
  workflow_data: Record<string, unknown>;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

// Types for Workflow Simple (for dropdowns)
export interface WorkflowSimple {
  id: number;
  name: string;
  description?: string;
}

// Types for Service Requests
export interface ServiceRequest {
  id?: number;
  catalog: number;
  catalog_detail?: ServiceCatalog;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  status_display?: string;
  assigned_type?: 'auto' | 'manual' | 'queue';
  assigned_type_display?: string;
  request_data?: Record<string, unknown>;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

// Types for Workflow Execution
export interface WorkflowExecution {
  id?: number;
  workflow: number;
  workflow_name?: string;
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  results?: Record<string, unknown>;
}

// Extended API slice with service management endpoints
export const serviceManagementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Service Categories - Using correct swagger endpoints
    getServiceCategories: builder.query<ServiceCategory[], void>({
      query: () => "/api/sm/categories/",
      providesTags: ["ServiceCategory"],
      transformResponse: (response: PaginatedResponse<ServiceCategory>) => {
        return response.results || [];
      },
      transformErrorResponse: (response) => {
        console.warn("API Error - Service Categories:", response);
        return response;
      },
    }),
    
    createServiceCategory: builder.mutation<ServiceCategory, Omit<ServiceCategory, "id" | "created_at" | "updated_at">>({
      query: (data) => ({
        url: "/api/sm/categories/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ServiceCategory"],
    }),

    updateServiceCategory: builder.mutation<ServiceCategory, { id: number; data: Partial<ServiceCategory> }>({
      query: ({ id, data }) => ({
        url: `/api/sm/categories/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ServiceCategory"],
    }),

    deleteServiceCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/sm/categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceCategory"],
    }),

    // Service Catalog - Using correct swagger endpoints
    getServiceCatalogs: builder.query<ServiceCatalog[], void>({
      query: () => "/api/sm/catalogs/",
      providesTags: ["ServiceCatalog"],
      transformResponse: (response: PaginatedResponse<ServiceCatalog>) => {
        return response.results || [];
      },
    }),

    createServiceCatalog: builder.mutation<ServiceCatalog, Omit<ServiceCatalog, "id" | "created_at" | "updated_at" | "sc_category_detail" | "wf_detail">>({
      query: (data) => ({
        url: "/api/sm/catalogs/create/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ServiceCatalog"],
    }),

    updateServiceCatalog: builder.mutation<ServiceCatalog, { id: number; data: Partial<ServiceCatalog> }>({
      query: ({ id, data }) => ({
        url: `/api/sm/catalogs/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ServiceCatalog"],
    }),

    deleteServiceCatalog: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/sm/catalogs/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceCatalog"],
    }),

    // Service Requests - Using correct swagger endpoints
    getServiceRequests: builder.query<ServiceRequest[], void>({
      query: () => "/api/sm/requests/",
      providesTags: ["ServiceRequest"],
      transformResponse: (response: PaginatedResponse<ServiceRequest>) => {
        return response.results || [];
      },
    }),

    createServiceRequest: builder.mutation<ServiceRequest, Omit<ServiceRequest, "id" | "created_at" | "updated_at" | "catalog_detail" | "status_display" | "assigned_type_display">>({
      query: (data) => ({
        url: "/api/sm/requests/create/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    updateServiceRequest: builder.mutation<ServiceRequest, { id: number; data: Partial<ServiceRequest> }>({
      query: ({ id, data }) => ({
        url: `/api/sm/requests/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    deleteServiceRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/sm/requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    // Workflows - Using correct swagger endpoints
    getWorkflows: builder.query<Workflow[], void>({
      query: () => "/workflow/api/workflows/",
      providesTags: ["Workflow"],
    }),

    createWorkflow: builder.mutation<Workflow, Omit<Workflow, "id" | "created_at" | "updated_at" | "created_by">>({
      query: (data) => ({
        url: "/workflow/api/workflows/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workflow"],
    }),

    updateWorkflow: builder.mutation<Workflow, { id: number; data: Partial<Workflow> }>({
      query: ({ id, data }) => ({
        url: `/workflow/api/workflows/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Workflow"],
    }),

    deleteWorkflow: builder.mutation<void, number>({
      query: (id) => ({
        url: `/workflow/api/workflows/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workflow"],
    }),

    executeWorkflow: builder.mutation<{ execution_id: string; status: string; message?: string }, { id: number; input_data?: Record<string, unknown> }>({
      query: ({ id, input_data = {} }) => ({
        url: `/workflow/api/workflows/${id}/execute/`,
        method: "POST",
        body: { input_data },
      }),
    }),

    // Workflow Executions
    getWorkflowExecutions: builder.query<WorkflowExecution[], void>({
      query: () => "/workflow/api/executions/",
      providesTags: ["Workflow"],
    }),

    getWorkflowExecution: builder.query<WorkflowExecution, number>({
      query: (id) => `/workflow/api/executions/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Workflow", id }],
    }),

    getExecutionLogs: builder.query<JobStep[], string>({
      query: (executionId) => `/workflow/api/executions/${executionId}/logs/`,
      providesTags: (_result, _error, executionId) => [{ type: "Workflow", id: executionId }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetServiceCategoriesQuery,
  useCreateServiceCategoryMutation,
  useUpdateServiceCategoryMutation,
  useDeleteServiceCategoryMutation,
  useGetServiceCatalogsQuery,
  useCreateServiceCatalogMutation,
  useUpdateServiceCatalogMutation,
  useDeleteServiceCatalogMutation,
  useGetServiceRequestsQuery,
  useCreateServiceRequestMutation,
  useUpdateServiceRequestMutation,
  useDeleteServiceRequestMutation,
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useExecuteWorkflowMutation,
  useGetWorkflowExecutionsQuery,
  useGetWorkflowExecutionQuery,
  useGetExecutionLogsQuery,
} = serviceManagementApi;
