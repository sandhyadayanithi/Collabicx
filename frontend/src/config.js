export const BACKEND_URL =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000')
    : 'https://collabicx.onrender.com';

export const SOCKET_URL =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (import.meta.env.VITE_ACTIVITY_SOCKET_URL || 'http://localhost:4000')
    : 'https://collabicx.onrender.com';
