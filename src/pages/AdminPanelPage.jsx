import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// Assuming you have updated your slices to export the async thunks
import {
  addCoreDevice,
  deleteCoreDevice,
  selectAllDevices,
} from "../redux/slices/coreDevicesSlice";
import {
  addCoreSite,
  deleteCoreSite,
  selectAllPikudim,
} from "../redux/slices/coreSitesSlice";
import {
  addNetType,
  deleteNetType,
  selectAllNetTypes,
} from "../redux/slices/networksSlice";
import { MdSettings, MdDelete } from "react-icons/md";

// Reusable Input Field Component (Unchanged)
const InputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) => (
  <div className="mb-4">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
    />
  </div>
);

// Reusable Select Field Component (Unchanged)
const SelectField = ({
  label,
  id,
  value,
  onChange,
  options,
  required = false,
}) => (
  <div className="mb-4">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
    >
      <option value="">-- Select --</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export function AdminPanelPage() {
  const dispatch = useDispatch();
  const allCoreSites = useSelector(selectAllPikudim);
  const allDevices = useSelector(selectAllDevices);
  const allNetTypes = useSelector(selectAllNetTypes);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAddSection, setActiveAddSection] = useState(null);
  const [activeDeleteSection, setActiveDeleteSection] = useState(null);
  const [itemToDelete, setItemToDelete] = useState("");

  const [coreSiteData, setCoreSiteData] = useState({
    name: "",
    type_id: "",
  });
  const [coreDeviceData, setCoreDeviceData] = useState({
    hostname: "",
    ip_address: "",
    network_type_id: "",
    core_pikudim_site_id: "",
  });
  const [netTypeData, setNetTypeData] = useState({ name: "" });

  const coreSiteOptions = allCoreSites.map((site) => ({
    value: site.id,
    label: site.core_site_name,
  }));
  const deviceOptions = allDevices.map((d) => ({
    value: d.id,
    label: d.hostname,
  }));
  const netTypeOptions = allNetTypes.map((nt) => ({
    value: nt.id,
    label: nt.name,
  }));

  // --- ASYNC EVENT HANDLERS ---
  const handleSubmit = async (
    e,
    thunk,
    payload,
    successMessage,
    formResetCallback
  ) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(thunk(payload)).unwrap();
      alert(successMessage);
      formResetCallback();
    } catch (error) {
      alert(`Error: ${error.message || "An unknown error occurred."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deleteThunk, entityName) => {
    if (!itemToDelete) {
      alert(`Please select a ${entityName} to delete.`);
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete this ${entityName}? This action is irreversible.`
      )
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(deleteThunk(parseInt(itemToDelete, 10))).unwrap();
      alert(`${entityName} deleted successfully!`);
      setItemToDelete("");
    } catch (error) {
      alert(
        `Error deleting ${entityName}: ${
          error.message || "An unknown error occurred."
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDeleteSection = (section) => {
    setActiveDeleteSection(section);
    setItemToDelete("");
  };

  const renderAddSectionForm = () => {
    switch (activeAddSection) {
      case "coreSite":
        return (
          <form
            onSubmit={(e) =>
              handleSubmit(
                e,
                addCoreSite,
                {
                  name: coreSiteData.name, // Changed from core_site_name
                  site_type_id: parseInt(coreSiteData.type_id, 10), // Changed from type_id
                  // "location" is removed as it's not in the backend spec
                },
                `Core Site "${coreSiteData.name}" submitted!`,
                () => setCoreSiteData({ name: "", type_id: "" })
              )
            }
            className="mt-6 space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Add New Core Site
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InputField
                label="Site Name"
                id="name"
                value={coreSiteData.name}
                onChange={(e) =>
                  setCoreSiteData({ ...coreSiteData, name: e.target.value })
                }
                required
              />
              <SelectField
                label="Type"
                id="type_id"
                value={coreSiteData.type_id}
                onChange={(e) =>
                  setCoreSiteData({ ...coreSiteData, type_id: e.target.value })
                }
                options={[
                  { value: 1, label: "L-Chart" },
                  { value: 2, label: "P-Chart" },
                ]}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Add Core Site"}
            </button>
          </form>
        );
      case "coreDevice":
        return (
          <form
            onSubmit={(e) =>
              handleSubmit(
                e,
                addCoreDevice,
                {
                  hostname: coreDeviceData.hostname,
                  ip: coreDeviceData.ip_address, // Changed from ip_address
                  device_net_type: parseInt(coreDeviceData.network_type_id, 10), // Changed from network_type_id
                  site_id: parseInt(coreDeviceData.core_pikudim_site_id, 10), // Changed from core_pikudim_site_id
                },
                `Device "${coreDeviceData.hostname}" submitted!`,
                () =>
                  setCoreDeviceData({
                    hostname: "",
                    ip_address: "",
                    network_type_id: "",
                    core_pikudim_site_id: "",
                  })
              )
            }
            className="mt-6 space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Add New Core Device
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InputField
                label="Hostname"
                id="hostname"
                value={coreDeviceData.hostname}
                onChange={(e) =>
                  setCoreDeviceData({
                    ...coreDeviceData,
                    hostname: e.target.value,
                  })
                }
                required
              />
              <InputField
                label="IP Address"
                id="ip_address"
                value={coreDeviceData.ip_address}
                onChange={(e) =>
                  setCoreDeviceData({
                    ...coreDeviceData,
                    ip_address: e.target.value,
                  })
                }
                required
              />
              <SelectField
                label="Associated Core Site"
                id="core_pikudim_site_id"
                value={coreDeviceData.core_pikudim_site_id}
                onChange={(e) =>
                  setCoreDeviceData({
                    ...coreDeviceData,
                    core_pikudim_site_id: e.target.value,
                  })
                }
                options={coreSiteOptions}
                required
              />
              <SelectField
                label="Network Type"
                id="network_type_id"
                value={coreDeviceData.network_type_id}
                onChange={(e) =>
                  setCoreDeviceData({
                    ...coreDeviceData,
                    network_type_id: e.target.value,
                  })
                }
                options={netTypeOptions}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Add Core Device"}
            </button>
          </form>
        );
      case "netType":
        return (
          <form
            onSubmit={(e) =>
              handleSubmit(
                e,
                addNetType,
                { name: netTypeData.name },
                `Net Type "${netTypeData.name}" submitted!`,
                () => setNetTypeData({ name: "" })
              )
            }
            className="mt-6 space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Add New Net Type
            </h3>
            <div>
              <InputField
                label="Net Type Name"
                id="netTypeName"
                value={netTypeData.name}
                onChange={(e) =>
                  setNetTypeData({ ...netTypeData, name: e.target.value })
                }
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Add Net Type"}
            </button>
          </form>
        );
      default:
        return (
          <div className="text-center py-16 px-4 mt-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <MdSettings
              size={56}
              className="mx-auto text-gray-400 dark:text-gray-500 mb-4"
            />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">
              Admin Control
            </p>
            <p className="text-md text-gray-500 dark:text-gray-500 mt-2">
              Select an action above to manage system entities.
            </p>
          </div>
        );
    }
  };

  const renderDeleteSectionForm = () => {
    switch (activeDeleteSection) {
      case "deleteCoreSite":
        return (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-4 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
          >
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">
              Delete Core Site
            </h3>
            <SelectField
              label="Select Core Site to Delete"
              id="delete_site_id"
              value={itemToDelete}
              onChange={(e) => setItemToDelete(e.target.value)}
              options={coreSiteOptions}
              required
            />
            <button
              onClick={() => handleDelete(deleteCoreSite, "Core Site")}
              disabled={isSubmitting || !itemToDelete}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Deleting..." : "Delete Core Site"}
            </button>
          </form>
        );
      case "deleteDevice":
        return (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-4 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
          >
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">
              Delete Core Device
            </h3>
            <SelectField
              label="Select Device to Delete"
              id="delete_device_id"
              value={itemToDelete}
              onChange={(e) => setItemToDelete(e.target.value)}
              options={deviceOptions}
              required
            />
            <button
              onClick={() => handleDelete(deleteCoreDevice, "Device")}
              disabled={isSubmitting || !itemToDelete}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Deleting..." : "Delete Core Device"}
            </button>
          </form>
        );
      case "deleteNetType":
        return (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-4 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
          >
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">
              Delete Net Type
            </h3>
            <SelectField
              label="Select Net Type to Delete"
              id="delete_nettype_id"
              value={itemToDelete}
              onChange={(e) => setItemToDelete(e.target.value)}
              options={netTypeOptions}
              required
            />
            <button
              onClick={() => handleDelete(deleteNetType, "Net Type")}
              disabled={isSubmitting || !itemToDelete}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Deleting..." : "Delete Net Type"}
            </button>
          </form>
        );
      default:
        return (
          <div className="text-center py-16 px-4 mt-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <MdDelete
              size={56}
              className="mx-auto text-gray-400 dark:text-gray-500 mb-4"
            />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">
              Deletion Zone
            </p>
            <p className="text-md text-gray-500 dark:text-gray-500 mt-2">
              Select an item type above to delete an entity. This action is
              irreversible.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full space-y-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Admin Panel
        </h1>
        <p className="text-md text-gray-600 dark:text-gray-400 mt-1">
          Manage core system entities like Core Sites, Devices, and Net Types.
        </p>
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
          Add Entities
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveAddSection("coreSite")}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 ${
              activeAddSection === "coreSite"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Add Core Site
          </button>
          <button
            onClick={() => setActiveAddSection("coreDevice")}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 ${
              activeAddSection === "coreDevice"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Add Core Device
          </button>
          <button
            onClick={() => setActiveAddSection("netType")}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 ${
              activeAddSection === "netType"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Add Net Type
          </button>
        </div>
        {renderAddSectionForm()}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
          Delete Entities
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSetDeleteSection("deleteCoreSite")}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 ${
              activeDeleteSection === "deleteCoreSite"
                ? "bg-red-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Delete Core Site
          </button>
          <button
            onClick={() => handleSetDeleteSection("deleteDevice")}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 ${
              activeDeleteSection === "deleteDevice"
                ? "bg-red-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Delete Core Device
          </button>
          <button
            onClick={() => handleSetDeleteSection("deleteNetType")}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 ${
              activeDeleteSection === "deleteNetType"
                ? "bg-red-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Delete Net Type
          </button>
        </div>
        {renderDeleteSectionForm()}
      </div>
    </div>
  );
}
