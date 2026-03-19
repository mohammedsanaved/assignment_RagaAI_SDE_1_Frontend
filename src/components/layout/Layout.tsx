import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar, Header } from './Sidebar';
import { GlobalErrorBanner } from '../GlobalErrorBanner';
import { useAuthStore } from '@/src/app/store/authStore';
import { useSidebarStore } from '@/src/app/store/sidebarStore';
import { cn } from '@/src/utils/cn';
import { motion } from 'motion/react';

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const { isCollapsed } = useSidebarStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header />
        <GlobalErrorBanner />
        <main className="p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
