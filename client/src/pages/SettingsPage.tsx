import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Percent,
  Calendar,
  DollarSign,
} from "lucide-react";
import { discountsAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface Discount {
  id: number;
  name: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number | string; // Allow both number and string
  minimum_amount?: number | string; // Allow both number and string
  start_date?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

const SettingsPage: React.FC = () => {
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [discountFormData, setDiscountFormData] = useState({
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minimum_amount: "",
    start_date: "",
    valid_until: "",
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Fetch discounts
  const { data: discountsData, isLoading: discountsLoading } = useQuery(
    ["discounts", searchTerm],
    () => discountsAPI.getAll({ search: searchTerm }),
    { keepPreviousData: true }
  );

  // Create discount mutation
  const createDiscountMutation = useMutation(discountsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries("discounts");
      toast.success("Discount created successfully!");
      handleCloseDiscountModal();
    },
    onError: (error: any) => {
      console.error("Create discount error:", error);
      console.error("Error response:", error.response?.data);

      // Show specific validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach((field) => {
          errors[field].forEach((message: string) => {
            toast.error(`${field}: ${message}`);
          });
        });
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create discount"
        );
      }
    },
  });

  // Update discount mutation
  const updateDiscountMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => discountsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("discounts");
        toast.success("Discount updated successfully!");
        handleCloseDiscountModal();
      },
      onError: (error: any) => {
        console.error("Update discount error:", error);
        console.error("Error response:", error.response?.data);

        // Show specific validation errors
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          Object.keys(errors).forEach((field) => {
            errors[field].forEach((message: string) => {
              toast.error(`${field}: ${message}`);
            });
          });
        } else {
          toast.error(
            error.response?.data?.message || "Failed to update discount"
          );
        }
      },
    }
  );

  // Delete discount mutation
  const deleteDiscountMutation = useMutation(discountsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries("discounts");
      toast.success("Discount deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete discount");
    },
  });

  const discounts: Discount[] = discountsData?.data?.data || [];

  const handleOpenDiscountModal = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount);
      setDiscountFormData({
        name: discount.name,
        description: discount.description || "",
        type: discount.type,
        value: discount.value.toString(),
        minimum_amount: discount.minimum_amount?.toString() || "",
        start_date: discount.start_date
          ? new Date(discount.start_date).toISOString().slice(0, 16)
          : "",
        valid_until: discount.valid_until
          ? new Date(discount.valid_until).toISOString().slice(0, 16)
          : "",
        is_active: discount.is_active,
      });
    } else {
      setEditingDiscount(null);
      setDiscountFormData({
        name: "",
        description: "",
        type: "percentage",
        value: "",
        minimum_amount: "",
        start_date: "",
        valid_until: "",
        is_active: true,
      });
    }
    setShowDiscountModal(true);
  };

  const handleCloseDiscountModal = () => {
    setShowDiscountModal(false);
    setEditingDiscount(null);
  };

  const handleDiscountInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setDiscountFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...discountFormData,
      value: parseFloat(discountFormData.value),
      minimum_amount: discountFormData.minimum_amount
        ? parseFloat(discountFormData.minimum_amount)
        : null,
      start_date: discountFormData.start_date || null,
      valid_until: discountFormData.valid_until || null,
    };

    if (editingDiscount) {
      updateDiscountMutation.mutate({
        id: editingDiscount.id,
        data: submitData,
      });
    } else {
      createDiscountMutation.mutate(submitData);
    }
  };

  const handleDeleteDiscount = (discount: Discount) => {
    if (
      window.confirm(
        `Are you sure you want to delete the discount "${discount.name}"?`
      )
    ) {
      deleteDiscountMutation.mutate(discount.id);
    }
  };

  const isDiscountLoading =
    createDiscountMutation.isLoading || updateDiscountMutation.isLoading;

  return (
    <div className="settings-page fade-in">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">
            Manage system settings and configurations
          </p>
        </div>
      </div>

      {/* Discount Management Section */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="flex-between">
            <h3>Discount Management</h3>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenDiscountModal()}
            >
              <Plus size={16} />
              Add Discount
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Search */}
          <div className="mb-4">
            <div style={{ position: "relative", maxWidth: "400px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#666",
                }}
              />
              <input
                type="text"
                placeholder="Search discounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>

          {/* Discounts Table */}
          {discountsLoading ? (
            <div className="text-center p-4">
              <LoadingSpinner />
              <p className="mt-2">Loading discounts...</p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center p-4">
              <Percent size={48} color="#ccc" />
              <h4 style={{ color: "#999", margin: "1rem 0 0.5rem 0" }}>
                No Discounts Found
              </h4>
              <p className="text-muted">
                Create your first discount to get started.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Amount</th>
                    <th>Valid Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount) => (
                    <tr key={discount.id}>
                      <td>
                        <div>
                          <strong>{discount.name}</strong>
                          {discount.description && (
                            <>
                              <br />
                              <small className="text-muted">
                                {discount.description}
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            discount.type === "percentage"
                              ? "badge-info"
                              : "badge-success"
                          }`}
                        >
                          {discount.type === "percentage"
                            ? "Percentage"
                            : "Fixed Amount"}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {discount.type === "percentage"
                            ? `${Number(discount.value).toFixed(1)}%`
                            : `₱${Number(discount.value).toFixed(2)}`}
                        </strong>
                      </td>
                      <td>
                        {discount.minimum_amount
                          ? `₱${Number(discount.minimum_amount).toFixed(2)}`
                          : "No minimum"}
                      </td>
                      <td>
                        <div style={{ fontSize: "12px" }}>
                          {discount.start_date ? (
                            <div>
                              <strong>Start:</strong>{" "}
                              {new Date(
                                discount.start_date
                              ).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-muted">Starts immediately</div>
                          )}
                          {discount.valid_until ? (
                            <div>
                              <strong>End:</strong>{" "}
                              {new Date(
                                discount.valid_until
                              ).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-muted">Never expires</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            discount.is_active
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {discount.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex" style={{ gap: "0.5rem" }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenDiscountModal(discount)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteDiscount(discount)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Other Settings Sections can be added here */}
      <div className="card">
        <div className="card-header">
          <h3>System Information</h3>
        </div>
        <div className="card-body">
          <div className="grid-2" style={{ gap: "2rem" }}>
            <div>
              <h5>Application Details</h5>
              <div className="system-info">
                <div className="flex-between mb-2">
                  <span>System Name:</span>
                  <strong>ChicCheckout POS</strong>
                </div>
                <div className="flex-between mb-2">
                  <span>Version:</span>
                  <strong>1.0.0</strong>
                </div>
                <div className="flex-between mb-2">
                  <span>Environment:</span>
                  <span className="badge badge-info">Development</span>
                </div>
              </div>
            </div>
            <div>
              <h5>Quick Actions</h5>
              <div className="grid-2" style={{ gap: "1rem" }}>
                <button className="btn btn-outline">
                  <Calendar size={16} />
                  Backup Data
                </button>
                <button className="btn btn-outline">
                  <DollarSign size={16} />
                  Export Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDiscount ? "Edit Discount" : "Add New Discount"}
              </h3>
              <button
                className="modal-close"
                onClick={handleCloseDiscountModal}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleDiscountSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Discount Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={discountFormData.name}
                      onChange={handleDiscountInputChange}
                      className="form-input"
                      placeholder="e.g., Summer Sale, New Customer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount Type *</label>
                    <select
                      name="type"
                      value={discountFormData.type}
                      onChange={handleDiscountInputChange}
                      className="form-select"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₱)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {discountFormData.type === "percentage"
                        ? "Percentage Value *"
                        : "Fixed Amount *"}
                    </label>
                    <input
                      type="number"
                      name="value"
                      value={discountFormData.value}
                      onChange={handleDiscountInputChange}
                      className="form-input"
                      placeholder={
                        discountFormData.type === "percentage"
                          ? "e.g., 10 (for 10%)"
                          : "e.g., 100 (for ₱100)"
                      }
                      step={
                        discountFormData.type === "percentage" ? "0.1" : "0.01"
                      }
                      min="0"
                      max={
                        discountFormData.type === "percentage"
                          ? "100"
                          : undefined
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Amount</label>
                    <input
                      type="number"
                      name="minimum_amount"
                      value={discountFormData.minimum_amount}
                      onChange={handleDiscountInputChange}
                      className="form-input"
                      placeholder="e.g., 500 (minimum ₱500 purchase)"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      value={discountFormData.start_date}
                      onChange={handleDiscountInputChange}
                      className="form-input"
                    />
                    <small className="text-muted">
                      Leave empty if discount should be active immediately
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      name="valid_until"
                      value={discountFormData.valid_until}
                      onChange={handleDiscountInputChange}
                      className="form-input"
                    />
                    <small className="text-muted">
                      Leave empty if discount should never expire
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={discountFormData.description}
                    onChange={handleDiscountInputChange}
                    className="form-textarea"
                    rows={3}
                    placeholder="Optional description for this discount..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={discountFormData.is_active}
                      onChange={handleDiscountInputChange}
                    />
                    <span>Active (discount is available for use)</span>
                  </label>
                </div>

                {/* Preview */}
                {discountFormData.name && discountFormData.value && (
                  <div
                    className="discount-preview mt-4 p-3"
                    style={{
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <h5 style={{ margin: "0 0 0.5rem 0" }}>Preview</h5>
                    <div className="flex-between">
                      <span>{discountFormData.name}</span>
                      <strong>
                        {discountFormData.type === "percentage"
                          ? `${discountFormData.value}% OFF`
                          : `₱${discountFormData.value} OFF`}
                      </strong>
                    </div>
                    {discountFormData.minimum_amount && (
                      <small className="text-muted">
                        Minimum purchase: ₱{discountFormData.minimum_amount}
                      </small>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDiscountModal}
                  disabled={isDiscountLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isDiscountLoading}
                >
                  {isDiscountLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      {editingDiscount ? "Updating..." : "Creating..."}
                    </>
                  ) : editingDiscount ? (
                    "Update Discount"
                  ) : (
                    "Create Discount"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
