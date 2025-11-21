// app/user/login/page.tsx
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f9f7f1] flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Suspense Wrapper */}
      <div className="w-full max-w-md">
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full">
      <div className="animate-pulse space-y-4">

        {/* Title */}
        <div className="h-7 sm:h-8 bg-gray-200 rounded w-2/3 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>

        {/* Button */}
        <div className="h-10 bg-gray-200 rounded mt-4"></div>
      </div>
    </div>
  );
}
