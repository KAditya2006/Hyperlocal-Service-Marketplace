const AVAILABILITY_STYLES = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Busy: 'bg-amber-50 text-amber-700 border-amber-100',
  Offline: 'bg-slate-100 text-slate-600 border-slate-200',
  'Pending Verification': 'bg-indigo-50 text-indigo-700 border-indigo-100'
};

export const getWorkerAvailabilityStatus = (worker) => {
  if (worker?.availabilityStatus) return worker.availabilityStatus;
  if (worker?.availability === false) return 'Offline';
  return 'Available';
};

export const getWorkerAvailabilityClass = (status) => {
  return AVAILABILITY_STYLES[status] || AVAILABILITY_STYLES.Available;
};
