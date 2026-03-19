import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/src/app/store/authStore';
import { useSidebarStore } from '@/src/app/store/sidebarStore';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/utils/cn';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, toggle, toggleMobile, setMobileOpen } =
    useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className='fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden'
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r border-slate-200 bg-white p-4 transition-all duration-300',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64', // Default width for mobile
        )}
      >
        <div className='flex h-full flex-col justify-between'>
          <div>
            <div
              className={cn(
                'mb-8 flex items-center gap-2 px-2',
                isCollapsed ? 'lg:justify-center' : 'justify-between',
              )}
            >
              <div className='flex items-center gap-2'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200'>
                  <PlusCircle size={24} />
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='text-xl font-bold tracking-tight text-slate-900'
                  >
                    HealSync
                  </motion.span>
                )}
              </div>

              {/* Desktop Toggle */}
              {!isCollapsed && (
                <button
                  onClick={toggle}
                  className='hidden lg:block rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors'
                >
                  <Menu size={20} />
                </button>
              )}

              {/* Mobile Close */}
              <button
                onClick={() => setMobileOpen(false)}
                className='lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors'
              >
                <X size={20} />
              </button>
            </div>

            {isCollapsed && (
              <div className='mb-6 hidden lg:flex justify-center'>
                <button
                  onClick={toggle}
                  className='rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors'
                >
                  <Menu size={20} />
                </button>
              </div>
            )}

            <nav className='space-y-1'>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const showLabel = !isCollapsed || isMobileOpen;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={
                      isCollapsed && !isMobileOpen ? item.label : undefined
                    }
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isCollapsed && !isMobileOpen ? 'lg:justify-center' : '',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <item.icon
                      size={20}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive
                          ? 'text-emerald-600'
                          : 'text-slate-400 group-hover:text-slate-600',
                      )}
                    />
                    {showLabel && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {isActive && showLabel && (
                      <motion.div
                        layoutId='active-nav'
                        className='ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600'
                      />
                    )}
                    {isActive && isCollapsed && !isMobileOpen && (
                      <motion.div
                        layoutId='active-nav-dot'
                        className='absolute right-2 h-1.5 w-1.5 rounded-full bg-emerald-600'
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className='space-y-4'>
            {(!isCollapsed || isMobileOpen) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='rounded-2xl bg-slate-50 p-4'
              >
                <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                  Support
                </p>
                <p className='mt-1 text-sm text-slate-600'>
                  Need help with HealSync?
                </p>
                <Button
                  variant='ghost'
                  size='sm'
                  className='mt-2 w-full justify-start px-0 text-emerald-600 hover:bg-transparent hover:text-emerald-700'
                >
                  Contact Support
                </Button>
              </motion.div>
            )}

            <Button
              variant='ghost'
              className={cn(
                'w-full gap-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600',
                isCollapsed && !isMobileOpen
                  ? 'lg:justify-center px-0'
                  : 'justify-start',
              )}
              onClick={handleLogout}
              title={isCollapsed && !isMobileOpen ? 'Sign Out' : undefined}
            >
              <LogOut size={20} className='shrink-0' />
              {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Header() {
  const user = useAuthStore((state) => state.user);
  const { toggleMobile } = useSidebarStore();

  return (
    <header className='sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-8 backdrop-blur-md'>
      <div className='flex items-center gap-4'>
        <button
          onClick={toggleMobile}
          className='lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors'
        >
          <Menu size={20} />
        </button>

        {/* <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search patients, records..." 
            className="h-10 w-80 rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20"
          />
        </div> */}
      </div>

      <div className='flex items-center gap-4'>
        <button className='relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors'>
          <Bell size={20} />
          <span className='absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white' />
        </button>

        <div className='h-8 w-px bg-slate-200 mx-2' />

        <div className='flex items-center gap-3'>
          <div className='text-right hidden sm:block'>
            <p className='text-sm font-semibold text-slate-900'>
              {user?.displayName || 'Dr. Naved'}
            </p>
            <p className='text-xs text-slate-500'>{user?.email}</p>
          </div>
          <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md'>
            <div className='flex h-full w-full items-center justify-center rounded-[10px] bg-white text-emerald-600 font-bold'>
              {user?.displayName?.[0] || 'D'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
