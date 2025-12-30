import React, { useEffect, useState } from 'react';
import UserList from '../components/Admin/UserList';
import UserEditModal from '../components/Admin/UserEditModal';
import authService from '../services/auth';
import '../style/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getAllUsers();
      setUsers(data);
      showMessage(`${data.length} users loaded successfully`);
    } catch (error) {
      showMessage('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await authService.deleteUser(userId);
      showMessage('User deleted successfully');
      fetchUsers();
    } catch (error) {
      showMessage(error.message || 'Delete failed', 'error');
    }
  };

  const handleToggleStatus = async (userId, enabled) => {
    try {
      await authService.toggleUserActivation(userId, enabled);
      showMessage(`User ${enabled ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      showMessage('Status update failed', 'error');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await authService.updateUser(selectedUser.id, userData);
      showMessage('User updated successfully');
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      showMessage('Update failed', 'error');
    }
  };

  const handleAddUser = async () => {
    // This would open an Add User modal
    showMessage('Add user functionality not implemented yet', 'error');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <header className="header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage system users, roles, and permissions</p>
        </div>
        <span className="user-count">Total: {users.length}</span>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="refresh-btn"
          onClick={fetchUsers}
        >
          Refresh Users
        </button>
      </div>

      <UserList
        users={filteredUsers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {isModalOpen && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default UserManagement;