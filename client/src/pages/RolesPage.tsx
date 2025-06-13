import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Plus, Edit, Trash2, Search, Shield } from "lucide-react";
import { rolesAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  created_at: string;
}

const RolesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
  });

  const queryClient = useQueryClient();

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery(
    ["roles", searchTerm],
    () => rolesAPI.getAll({ search: searchTerm }),
    { keepPreviousData: true }
  );

  // Create role mutation
  const createRoleMutation = useMutation(rolesAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries("roles");
      toast.success("Role created successfully!");
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create role");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => rolesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("roles");
        toast.success("Role updated successfully!");
        handleCloseModal();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to update role");
      },
    }
  );

  // Delete role mutation
  const deleteRoleMutation = useMutation(rolesAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries("roles");
      toast.success("Role deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete role");
    },
  });

  const roles: Role[] = rolesData?.data?.data || [];

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        display_name: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const handleDelete = (role: Role) => {
    if (
      window.confirm(
        `Are you sure you want to delete the role "${role.display_name}"?`
      )
    ) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const isLoading =
    createRoleMutation.isLoading || updateRoleMutation.isLoading;

  return (
    <div className="roles-page fade-in">
      {/* Header */}
      <div className="page-header flex-between mb-4">
        <div>
          <h1>Role Management</h1>
          <p className="text-muted">Manage system roles and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          Add Role
        </button>
      </div>

      {/* Search */}
      <div className="search-section mb-4">
        <div className="card">
          <div className="card-body">
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
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="card">
        <div className="card-header">
          <h3>Roles ({roles.length})</h3>
        </div>
        <div className="card-body p-0">
          {rolesLoading ? (
            <div className="text-center p-4">
              <LoadingSpinner />
              <p className="mt-2">Loading roles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No roles found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Display Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <div
                          className="flex"
                          style={{ alignItems: "center", gap: "0.5rem" }}
                        >
                          <Shield size={16} color="var(--primary-color)" />
                          <strong>{role.name}</strong>
                        </div>
                      </td>
                      <td>{role.display_name}</td>
                      <td>{role.description}</td>
                      <td>{new Date(role.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex" style={{ gap: "0.5rem" }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenModal(role)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(role)}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRole ? "Edit Role" : "Add New Role"}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Role Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., admin, manager, cashier"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Display Name *</label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Administrator, Manager, Cashier"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe the role's responsibilities and permissions..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      {editingRole ? "Updating..." : "Creating..."}
                    </>
                  ) : editingRole ? (
                    "Update Role"
                  ) : (
                    "Create Role"
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

export default RolesPage;
