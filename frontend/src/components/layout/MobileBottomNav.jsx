import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  MessageSquare,
  User,
  Briefcase,
  Wallet
} from 'lucide-react';

const MOBILE_NAV_BY_ROLE = {
  user: [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Bookings', path: '/dashboard#bookings', icon: CalendarCheck },
    { label: 'Chat', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User }
  ],
  worker: [
    { label: 'Dashboard', path: '/worker/dashboard', icon: LayoutDashboard },
    { label: 'Jobs', path: '/worker/dashboard#jobs', icon: Briefcase },
    { label: 'Chat', path: '/messages', icon: MessageSquare },
    { label: 'Earnings', path: '/worker/dashboard#earnings', icon: Wallet },
    { label: 'Profile', path: '/profile', icon: User }
  ]
};

export const MobileBottomNav = ({ user, className = '' }) => {
  const location = useLocation();
  const role = user?.role || 'user';
  const navItems = MOBILE_NAV_BY_ROLE[role] || MOBILE_NAV_BY_ROLE.user;

  if (role === 'admin') return null; // Admin uses drawer / header menu

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 flex items-center justify-around shadow-lg ${className}`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (location.pathname + location.hash) === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl text-[11px] font-bold transition-all select-none ${
              isActive
                ? 'text-primary-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-primary-600 scale-110' : 'text-slate-400'} />
            <span className="mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
