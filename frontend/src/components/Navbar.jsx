import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, LogOut } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '../services/api';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const fallbackAvatar = 'https://res.cloudinary.com/di9yc9sc8/image/upload/v1712668582/default-avatar_v0jzqy.png';
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await getNotifications({ limit: 5 });
        setNotifications(data.data);
        setUnread(data.unread);
      } catch {
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [token]);

  const handleNotificationOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && unread > 0) {
      await markNotificationsRead();
      setUnread(0);
    }
  };

  return (
    <nav className="glass sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-gray-100">
      <Link to="/" className="text-2xl font-bold tracking-tight text-primary-600 font-heading">
        Hyperlocal<span className="text-slate-900">Market</span>
      </Link>

      <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
        <Link to="/search" className="hover:text-primary-600 flex items-center gap-2">
          <Search size={18} /> Search Services
        </Link>
        {!token && (
          <Link to="/signup" className="hover:text-primary-600">
            Become a Worker
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={handleNotificationOpen} className="p-2 text-slate-400 hover:text-primary-600 transition-colors relative" title="Notifications">
                <Bell size={20} />
                {unread > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full min-w-5 h-5 flex items-center justify-center font-bold">{unread}</span>}
              </button>
              {open && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl premium-shadow overflow-hidden">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 font-bold">No notifications yet.</p>
                  ) : notifications.map((notification) => (
                    <div key={notification._id} className="p-4 border-b border-slate-50 last:border-0">
                      <p className="font-bold text-slate-900 text-sm">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
             {user?.role === 'worker' && (
              <Link to="/worker/dashboard" className="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-semibold border border-primary-100 hover:bg-primary-100 transition-colors">
                Worker Panel
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors">
                Admin Panel
              </Link>
            )}
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
            <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-primary-100 overflow-hidden hover:scale-105 transition-transform">
              <img src={user?.avatar || fallbackAvatar} alt="Avatar" className="w-full h-full object-cover" />
            </Link>
          </div>
        ) : (
          <>
            <Link to="/login" className="px-5 py-2 text-slate-600 hover:text-primary-600 font-medium tracking-wide">
              Login
            </Link>
            <Link to="/signup" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold premium-shadow transition-all hover:translate-y-[-2px]">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
