"use client";

import { useGetServiceRequestsQuery } from "../../../redux/features/serviceManagementSlice";

const Requests = () => {
  const { data: requestsResponse, isLoading, error } = useGetServiceRequestsQuery();

  // Ensure we always have an array to work with
  const requests = Array.isArray(requestsResponse) ? requestsResponse : [];

  console.log("Requests response:", requestsResponse); // Debug log

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-600";
      case "in_progress":
        return "bg-blue-50 text-blue-600";
      case "pending":
        return "bg-yellow-50 text-yellow-600";
      case "rejected":
        return "bg-red-50 text-red-600";
      case "approved":
        return "bg-emerald-50 text-emerald-600";
      case "cancelled":
        return "bg-gray-50 text-gray-600";
      case "draft":
        return "bg-slate-50 text-slate-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded border">
        <h2 className="text-xl mb-4">My Requests</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading requests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading requests:", error); // Debug log
    return (
      <div className="bg-white p-6 rounded border">
        <h2 className="text-xl mb-4">My Requests</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600">
            Error loading requests: {JSON.stringify(error)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded border">
      <h2 className="text-xl mb-4">My Requests</h2>
      
      {!requests || requests.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No requests found. Start by requesting a service from the catalog.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4">Request ID</th>
                <th className="p-4">Service</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4">Notes</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-blue-600 cursor-pointer font-medium">
                    {request.id}
                  </td>
                  <td className="p-4">{request.catalog_detail?.name || "Unknown Service"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">{request.created_at ? formatDate(request.created_at) : "N/A"}</td>
                  <td className="p-4 max-w-xs truncate">{request.notes || "No notes"}</td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Requests;
