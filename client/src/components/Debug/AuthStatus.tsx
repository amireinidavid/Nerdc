// 'use client';

// import { useEffect, useState } from 'react';
// import useAuthStore from '@/store/authStore';
// import axios from 'axios';
// import { BASE_API_URL } from '@/utils/constants';

// // Debug component to display authentication status
// const AuthStatus = () => {
//   const { user, isAuthenticated, isResearcher, isAdmin } = useAuthStore();
//   const [apiResponse, setApiResponse] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const checkServerAuth = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // Add access token from localStorage if it exists
//       const accessToken = localStorage.getItem('accessToken');
//       const headers: Record<string, string> = {};
      
//       if (accessToken) {
//         headers['Authorization'] = `Bearer ${accessToken}`;
//       }
      
//       const response = await axios.get(`${BASE_API_URL}/api/journals/check-auth`, { 
//         headers,
//         withCredentials: true // Important for cookies
//       });
//       setApiResponse(response.data);
//     } catch (err: any) {
//       console.error('Error checking server auth:', err);
//       setError(err.response?.data?.message || err.message || 'Unknown error');
//       setApiResponse(err.response?.data || null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Call server auth check on mount
//     checkServerAuth();
//   }, []);

//   return (
//     <div className="bg-white rounded-lg shadow-md p-4 border border-emerald-200 my-4">
//       <h2 className="text-xl font-semibold mb-3 text-emerald-700">Auth Debug Panel</h2>
      
//       <div className="space-y-2 mb-4">
//         <p><span className="font-medium">Authenticated:</span> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
//         <p><span className="font-medium">User ID:</span> {user?.id || 'Not logged in'}</p>
//         <p><span className="font-medium">Email:</span> {user?.email || 'N/A'}</p>
//         <p><span className="font-medium">Role:</span> {user?.role || 'N/A'}</p>
//         <p><span className="font-medium">Is Author:</span> {isResearcher() ? '✅ Yes' : '❌ No'}</p>
//         <p><span className="font-medium">Is Admin:</span> {isAdmin() ? '✅ Yes' : '❌ No'}</p>
//         <p><span className="font-medium">Access Token:</span> {localStorage.getItem('accessToken') ? '✅ Present' : '❌ Missing'}</p>
//         <p><span className="font-medium">Refresh Token:</span> {localStorage.getItem('refreshToken') ? '✅ Present' : '❌ Missing'}</p>
//       </div>
      
//       <div className="mb-4">
//         <button 
//           onClick={checkServerAuth}
//           disabled={loading}
//           className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
//         >
//           {loading ? 'Checking...' : 'Check Server Auth'}
//         </button>
//       </div>
      
//       {error && (
//         <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 mb-4">
//           <p className="font-semibold">Error:</p>
//           <p>{error}</p>
//         </div>
//       )}
      
//       {apiResponse && (
//         <div className="mt-4">
//           <p className="font-medium mb-2">Server Response:</p>
//           <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-60 text-sm">
//             {JSON.stringify(apiResponse, null, 2)}
//           </pre>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AuthStatus; 