// import authService from '../services/auth'; 

// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8080/api';

// // Create shared api instance with auth interceptors
// const sharedApi = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add auth interceptor
// sharedApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export const userService = {
//   getAllUsers: async () => {
//     const response = await authService.get('/admin/users');
//     return response.data;
//   },

//   getUserById: async (id) => {
//     const response = await authService.get(`/admin/users/${id}`);
//     return response.data;
//   },

//   updateUser: async (id, userData) => {
//     const response = await authService.put(`/admin/users/${id}`, userData);
//     return response.data;
//   },

//   deleteUser: async (id) => {
//     const response = await authService.delete(`/admin/users/${id}`);
//     return response.data;
//   },

//   toggleUserStatus: async (id, enabled) => {
//     const response = await authService.patch(`/admin/users/${id}/activate?active=${enabled}`);
//     return response.data;
//   }
// };

// export default userService;