import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import LanguageSwitcher from '../LanguageSwitcher';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const AppHeader = ({
  user,
  onMenuToggle,
  rightSlot,
  className = ''
}) => {
  return (
    <header
      className={`sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu size={22} />
            </button>
          )}

          <BrandLogo to={user?.role === 'worker' ? '/worker/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/'} />
        </div>

        {/* Right: Language Switcher + User Info / Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {rightSlot}

          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Avatar
                src={user.avatar}
                alt={user.name}
                size="sm"
                isOnline={user.isOnline}
              />
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate max-w-28">{user.name}</p>
                <Badge status={user.role} size="sm" />
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" variant="primary">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
