export const getUserPresenceStatus = (user) => user?.isOnline ? 'Online' : 'Offline';

export const getUserPresenceClass = (user) => (
  user?.isOnline
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-slate-100 text-slate-600 border-slate-200'
);

export const getPresenceDotClass = (isOnline) => (
  isOnline ? 'bg-emerald-500' : 'bg-slate-300'
);
