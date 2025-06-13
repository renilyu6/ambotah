import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react'
import { usersAPI } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface User {
  id: number
  first_name: string
  middle_name?: string
  last_name: string
  suffix_name?: string
  birth_date: string
  gender: string
  address: string
  contact_number: string
  email: string
  role: {
    id: number
    name: string
    display_name: string
  }
  is_active: boolean
  created_at: string
}

interface Role {
  id: number
  name: string
  display_name: string
}

const UsersPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix_name: '',
    birth_date: '',
    gender: '',
    address: '',
    contact_number: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_id: ''
  })

  const queryClient = useQueryClient()

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['users', searchTerm],
    () => usersAPI.getAll({ search: searchTerm }),
    { keepPreviousData: true }
  )

  // Fetch roles
  const { data: rolesData } = useQuery('roles', usersAPI.getRoles)

  // Create user mutation
  const createUserMutation = useMutation(usersAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      toast.success('User created successfully!')
      handleCloseModal()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user')
    }
  })

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => usersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('User updated successfully!')
        handleCloseModal()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user')
      }
    }
  )

  // Delete user mutation
  const deleteUserMutation = useMutation(usersAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      toast.success('User deactivated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user')
    }
  })

  const users: User[] = usersData?.data?.data || []
  const roles: Role[] = rolesData?.data?.roles || []

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        first_name: user.first_name,
        middle_name: user.middle_name || '',
        last_name: user.last_name,
        suffix_name: user.suffix_name || '',
        birth_date: user.birth_date,
        gender: user.gender,
        address: user.address,
        contact_number: user.contact_number,
        email: user.email,
        password: '',
        password_confirmation: '',
        role_id: user.role.id.toString()
      })
    } else {
      setEditingUser(null)
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix_name: '',
        birth_date: '',
        gender: '',
        address: '',
        contact_number: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingUser) {
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
        delete updateData.password_confirmation
      }
      updateUserMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      createUserMutation.mutate(formData)
    }
  }

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.first_name} ${user.last_name}?`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const isLoading = createUserMutation.isLoading || updateUserMutation.isLoading

  return (
    <div className="users-page fade-in">
      {/* Header */}
      <div className="page-header flex-between mb-4">
        <div>
          <h1>User Management</h1>
          <p className="text-muted">Manage system users and their roles</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="search-section mb-4">
        <div className="card">
          <div className="card-body">
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }} 
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3>Users ({users.length})</h3>
        </div>
        <div className="card-body p-0">
          {usersLoading ? (
            <div className="text-center p-4">
              <LoadingSpinner />
              <p className="mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No users found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <strong>
                            {user.first_name} {user.middle_name} {user.last_name} {user.suffix_name}
                          </strong>
                          <br />
                          <small className="text-muted">{user.gender}</small>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="badge badge-primary">
                          {user.role.display_name}
                        </span>
                      </td>
                      <td>{user.contact_number}</td>
                      <td>
                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex" style={{ gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user)}
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
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suffix</label>
                    <input
                      type="text"
                      name="suffix_name"
                      value={formData.suffix_name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Jr., Sr., III, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Birth Date *</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Password {!editingUser && '*'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="form-input"
                        required={!editingUser}
                        style={{ paddingRight: '3rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Confirm Password {!editingUser && '*'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      className="form-input"
                      required={!editingUser}
                    />
                  </div>
                </div>

                {editingUser && (
                  <div className="alert alert-info">
                    <strong>Note:</strong> Leave password fields empty to keep current password.
                  </div>
                )}
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
                      {editingUser ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingUser ? 'Update User' : 'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .table-responsive {
          overflow-x: auto;
        }
        
        .page-header h1 {
          margin-bottom: 0.25rem;
        }
        
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .modal {
            width: 95%;
            margin: 1rem;
          }
          
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default UsersPage