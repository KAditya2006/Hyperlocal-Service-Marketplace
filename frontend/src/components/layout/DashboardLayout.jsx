import { useState } from 'react';
import AppHeader from './AppHeader';
import DashboardSidebar from './DashboardSidebar';
import MobileBottomNav from './MobileBottomNav';
import Drawer from '../ui/Drawer';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  MessageSquare,
  User,
  Briefcase,
  Wallet,
  Users,
  ShieldCheck,
  TrendingUp,
  Settings,
  LogOut
} from 'lucide-react';
import BrandLogo from '../BrandLogo';

const NAV_ITEMS_BY_ROLE = {
  user: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Find Service', path: '/search', icon: Search },
    { label: 'My Bookings', path: '/dashboard#bookings', icon: CalendarCheck },
    { label: 'Chat', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User }
  ],
  worker: [
    { label: 'Dashboard', path: '/worker/dashboard', icon: LayoutDashboard },
    { label: 'My Jobs', path: '/worker/dashboard#jobs', icon: Briefcase },
    { label: 'Chat', path: '/messages', icon: MessageSquare },
    { label: 'Earnings', path: '/worker/dashboard#earnings', icon: Wallet },
    { label: 'Profile', path: '/profile', icon: User }
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/dashboard#users', icon: Users },
    { label: 'Workers', path: '/admin/dashboard#workers', icon: Briefcase },
    { label: 'Verification', path: '/admin/dashboard#kyc', icon: ShieldCheck },
    { label: 'Analytics', path: '/admin/dashboard#analytics', icon: TrendingUp },
    { label: 'Settings', path: '/admin/dashboard#settings', icon: Settings }
  ]
};

export const DashboardLayout = ({
  user,
  onLogout,
  headerRightSlot,
  children,
  className = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  const role = user?.role || 'user';
  const navItems = NAV_ITEMS_BY_ROLE[role] || NAV_ITEMS_BY_ROLE.user;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <AppHeader
          user={user}
          onMenuToggle={() => setMobileDrawerOpen(true)}
          rightSlot={headerRightSlot}
        />

        {/* Page Content */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${className}`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav user={user} />

      {/* Mobile Sliding Drawer Menu */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        position="left"
        title="Menu"
      >
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <BrandLogo to={role === 'worker' ? '/worker/dashboard' : role === 'admin' ? '/admin/dashboard' : '/dashboard'} />
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (location.pathname + location.hash) === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {onLogout && (
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] cursor-pointer"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default DashboardLayout;
