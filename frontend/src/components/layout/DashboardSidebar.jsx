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
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import BrandLogo from '../BrandLogo';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

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

export const DashboardSidebar = ({
  user,
  collapsed = false,
  onToggleCollapse,
  onLogout,
  className = ''
}) => {
  const location = useLocation();
  const role = user?.role || 'user';
  const navItems = NAV_ITEMS_BY_ROLE[role] || NAV_ITEMS_BY_ROLE.user;

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between bg-white border-r border-slate-200/80 transition-all duration-200 h-screen sticky top-0 ${
        collapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
        {!collapsed && <BrandLogo to={role === 'worker' ? '/worker/dashboard' : role === 'admin' ? '/admin/dashboard' : '/dashboard'} />}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center mx-auto shadow-xs">
            IS
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname + location.hash) === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all select-none ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {user && (
          <Link
            to="/profile"
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Avatar
              src={user.avatar}
              alt={user.name}
              size="sm"
              isOnline={user.isOnline}
            />
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <Badge status={user.role} size="sm" />
              </div>
            )}
          </Link>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
