import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext';
import { Loader2 } from 'lucide-react';

export default function RequireSuperadmin() {
  const { currentUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2F6BFF]" />
      </div>
    );
  }

  // Jika bukan superadmin, arahkan langsung ke /admin (bukan layar kosong)
  if (!currentUser || currentUser.role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
