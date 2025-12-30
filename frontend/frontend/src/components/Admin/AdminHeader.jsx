import React from 'react';
import { authService } from '../../services/authService';

const AdminHeader = () => {
  const user = authService.getCurrentUser();

  return (
    <header className="bg-white shadow">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.username}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;