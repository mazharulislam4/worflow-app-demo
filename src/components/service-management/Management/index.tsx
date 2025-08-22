import { useGetServiceCatalogsQuery } from "../../../redux/features/serviceManagementSlice";

const Management = () => {
  const { data: services, isLoading, error } = useGetServiceCatalogsQuery();

  // Ensure we always have an array to work with
  const servicesList = Array.isArray(services) ? services : [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl mb-4">Service Management</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading services...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl mb-4">Service Management</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            Failed to load services. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl mb-4">Service Management</h2>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-4">Service Name</th>
            <th className="p-4">Category</th>
            <th className="p-4">Status</th>
            <th className="p-4">Workflow</th>
            <th className="p-4">Last Updated</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {servicesList.map((service) => (
            <tr key={service.id} className="border-t">
              <td className="p-4 flex items-center gap-2">
                ⚙️ {service.name}
              </td>
              <td className="p-4">{service.sc_category_detail?.name || "Uncategorized"}</td>
              <td className="p-4">
                <span className="text-green-700 text-xs bg-green-50 rounded-full px-4 text-center py-1 w-max">
                  {service.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="p-4">{service.wf_detail?.name || "No workflow"}</td>
              <td className="p-4">{formatDate(service.updated_at)}</td>
              <td className="p-4">
                <a className="text-blue-600 mr-2 cursor-pointer">Edit</a>
                <a className="text-red-600 cursor-pointer">Delete</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Management;
