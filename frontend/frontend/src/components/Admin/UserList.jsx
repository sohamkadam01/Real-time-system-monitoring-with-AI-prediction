import React from 'react';
import PropTypes from 'prop-types';
// import '../style/UserManagement.css';

const UserList = ({ users, onEdit, onDelete, onToggleStatus }) => {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👤</div>
        <h3>No users found</h3>
        <p>Try adjusting your search criteria or add new users</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th className="user-column">USER</th>
            <th className="contact-column">CONTACT INFO</th>
            <th className="role-column">ROLE</th>
            <th className="status-column">ACCOUNT STATUS</th>
            <th className="date-column">CREATED</th>
            <th className="actions-column">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="user-row">
              {/* USER COLUMN */}
              <td className="user-cell">
                <div className="user-info-container">
                  <div className="user-avatar">
                    <div className="avatar-circle">
                      {getInitials(user.username || user.name)}
                    </div>
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      <span className="name-text">{user.username || 'Unknown User'}</span>
                      {user.verified && (
                        <span className="verified-badge" title="Verified User">✓</span>
                      )}
                    </div>
                    <div className="user-id">ID: {user.id}</div>
                    <div className="user-display-name">
                      {user.name || 'No display name'}
                    </div>
                  </div>
                </div>
              </td>

              {/* CONTACT COLUMN */}
              <td className="contact-cell">
                <div className="contact-info">
                  <div className="email-info">
                    <span className="contact-icon">📧</span>
                    <a href={`mailto:${user.email}`} className="email-link">
                      {user.email || 'No email'}
                    </a>
                  </div>
                  {user.phone && (
                    <div className="phone-info">
                      <span className="contact-icon">📱</span>
                      <span className="phone-text">{user.phone}</span>
                    </div>
                  )}
                  <div className="contact-meta">
                    <span className="meta-item">
                      Last Login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </span>
                  </div>
                </div>
              </td>

              {/* ROLE COLUMN */}
              <td className="role-cell">
                <div className="role-info">
                  <span className={`role-badge role-${user.role?.toLowerCase() || 'user'}`}>
                    {user.role === 'ADMIN' ? '👑 Admin' : 
                     user.role === 'MANAGER' ? '📊 Manager' : 
                     user.role === 'MODERATOR' ? '🛡️ Moderator' : 
                     '👤 User'}
                  </span>
                  <div className="role-permissions">
                    {user.permissions && user.permissions.length > 0 ? (
                      <span className="permissions-count">
                        {user.permissions.length} permission{user.permissions.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="no-permissions">Basic access</span>
                    )}
                  </div>
                </div>
              </td>

              {/* STATUS COLUMN */}
              <td className="status-cell">
                <div className="status-container">
                  <div className="status-row">
                    <span className={`status-badge ${user.enabled ? 'status-active' : 'status-inactive'}`}>
                      <span className="status-icon">
                        {user.enabled ? '✅' : '❌'}
                      </span>
                      <span className="status-text">
                        {user.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <div className="status-row">
                    <span className={`lock-status ${user.accountNonLocked ? 'unlocked' : 'locked'}`}>
                      <span className="lock-icon">
                        {user.accountNonLocked ? '🔓' : '🔒'}
                      </span>
                      <span className="lock-text">
                        {user.accountNonLocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </span>
                  </div>
                  {user.twoFactorEnabled && (
                    <div className="status-row">
                      <span className="security-badge">
                        <span className="security-icon">🔐</span>
                        <span className="security-text">2FA Enabled</span>
                      </span>
                    </div>
                  )}
                </div>
              </td>

              
              <td className="date-cell">
                <div className="date-info">
                  <div className="created-date">
                    <span className="date-label">Created:</span>
                    <span className="date-value">
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="updated-date">
                    <span className="date-label">Updated:</span>
                    <span className="date-value">
                    
                    </span>
                  </div>
                  <div className="date-meta">
                    <span className="meta-text">
                      {user.loginCount ? `${user.loginCount} logins` : 'No logins'}
                    </span>
                  </div>
                </div>
              </td>

              {/* ACTIONS COLUMN */}
              <td className="actions-cell">
                <div className="actions-container">
                  <div className="action-row">
                    <button
                      onClick={() => onEdit(user)}
                      className="action-btn edit-btn"
                      title="Edit user details"
                    >
                      
                      <span className="action-text">Edit</span>
                    </button>
                  </div>
                  <div className="action-row">
                    <button
                      onClick={() => onToggleStatus(user.id, !user.enabled)}
                      className={`action-btn toggle-btn ${user.enabled ? 'deactivate' : 'activate'}`}
                      title={user.enabled ? 'Deactivate user account' : 'Activate user account'}
                    >
                      {/* <span className="action-icon">
                        {user.enabled ? '⛔' : '✅'}
                      </span> */}
                      {/* <span className="action-text">
                        {user.enabled ? 'Deactivate' : 'Activate'}
                      </span> */}
                    </button>
                  </div>
                  <div className="action-row">
                    <button
                      onClick={() => onDelete(user.id)}
                      className="action-btn delete-btn"
                      title="Delete user permanently"
                    >
                      <span className="action-text">Delete</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Table Footer */}
  
    </div>
  );
};

UserList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      username: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      role: PropTypes.string,
      enabled: PropTypes.bool,
      accountNonLocked: PropTypes.bool,
      verified: PropTypes.bool,
      twoFactorEnabled: PropTypes.bool,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
      lastLogin: PropTypes.string,
      loginCount: PropTypes.number,
      permissions: PropTypes.array,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
};

UserList.defaultProps = {
  users: []
};

export default UserList;