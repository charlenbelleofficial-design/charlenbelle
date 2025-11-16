// 'use client';
// import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// interface AdminLayoutProps {
//   children: React.ReactNode;
//   requiredRole?: string[];
// }

// export default function AdminLayout({ 
//   children, 
//   requiredRole = ['admin', 'superadmin', 'kasir', 'doctor'] 
// }: AdminLayoutProps) {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   useEffect(() => {
//     if (status === 'loading') return;

//     if (!session) {
//       router.push('/user/login?redirect=' + encodeURIComponent(window.location.pathname));
//       return;
//     }

//     const userRole = session.user?.role;
//     if (!userRole || !requiredRole.includes(userRole)) {
//       router.push('/user/dashboard');
//       return;
//     }
//   }, [session, status, router, requiredRole]);

//   if (status === 'loading') {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
//       </div>
//     );
//   }

//   if (!session) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {children}
//     </div>
//   );
// }