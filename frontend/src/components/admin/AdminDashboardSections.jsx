import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  XCircle
} from 'lucide-react';
import { fallbackAvatar, getInlineDocumentPreviewUrl, isPdfAsset, resolveAssetUrl, withImageFallback } from '../../utils/images';
import { formatInr } from '../../utils/formatters';
import { PROFESSIONS } from '../../constants/professions';

export const LIST_TABS = ['users', 'workers', 'bookings'];

export const EMPTY_MANAGED_ACCOUNT_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  skills: '',
  experience: '0',
  bio: '',
  amount: '',
  unit: 'hour'
};

const getStatusBadgeClass = (status) => {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    accepted: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-100',
    busy: 'bg-amber-50 text-amber-700 border-amber-100',
    offline: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return styles[String(status || '').toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';
};

export const getTranslatedStatus = (t, status, fallback) => {
  const normalizedStatus = String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalizedStatus) return fallback || '';
  return t(`status.${normalizedStatus}`, { defaultValue: fallback || status });
};

const getAvailabilityLabel = (t, status) => {
  const value = String(status || '').trim();
  switch (value) {
    case 'Available':
      return t('common.available');
    case 'Busy':
      return t('admin.busy');
    case 'Offline':
      return t('admin.offline');
    case 'Pending Verification':
      return t('admin.pendingVerification');
    default:
      return value || t('common.unavailable');
  }
};

export const formatRoleLabel = (t, role) => {
  return role === 'worker' ? t('admin.worker') : t('admin.user');
};

export const StatusBadge = ({ children, status }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(status)}`}>
    {children}
  </span>
);

export const StatCard = ({ icon, label, value, change, color, onClick }) => (
  <button type="button" onClick={onClick} className="bg-white p-5 sm:p-8 rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 text-left transition-all hover:-translate-y-1 hover:border-primary-100">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 ${color} rounded-2xl`}>{icon}</div>
      <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">{change}</span>
    </div>
    <h3 className="text-4xl font-bold text-slate-900 font-heading tracking-tight mb-1">{value || 0}</h3>
    <p className="text-slate-500 font-bold text-sm tracking-wide">{label}</p>
  </button>
);

const DocumentPreview = ({ url, label }) => {
  const { t } = useTranslation();
  const [failedPreviewUrl, setFailedPreviewUrl] = useState('');
  const documentUrl = resolveAssetUrl(url);
  const previewUrl = getInlineDocumentPreviewUrl(documentUrl);
  const previewFailed = failedPreviewUrl === previewUrl;
  const shouldRenderPdfFrame = isPdfAsset(documentUrl) && previewUrl === documentUrl;

  if (!documentUrl) {
    return <span className="text-slate-300 font-bold italic">{t('admin.noDocumentUploaded')}</span>;
  }

  if (previewFailed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
        <FileText size={46} className="text-primary-500" />
        <span className="text-sm font-black uppercase tracking-widest">{label}</span>
        <span className="max-w-xs text-xs font-bold text-slate-400">
          {t('admin.inlinePreviewFailed')}
        </span>
      </div>
    );
  }

  if (shouldRenderPdfFrame) {
    return (
      <object
        data={documentUrl}
        type="application/pdf"
        className="h-full w-full bg-white"
        aria-label={label}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
          <FileText size={46} className="text-primary-500" />
          <span className="text-sm font-black uppercase tracking-widest">{label}</span>
          <span className="max-w-xs text-xs font-bold text-slate-400">
            {t('admin.previewUnavailable')}
          </span>
        </div>
      </object>
    );
  }

  return (
    <img
      src={previewUrl}
      className="h-full w-full object-contain"
      alt={label}
      onError={() => setFailedPreviewUrl(previewUrl)}
    />
  );
};

export const VerificationQueue = ({ workers, searchTerm, onSearchTermChange, onSelectWorker, onApprove }) => {
  const { t } = useTranslation();

  return (
    <section id="verification-queue" className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
      <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-2xl font-bold text-slate-900 font-heading">{t('admin.verificationQueue')}</h3>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={t('admin.searchApplicants')}
            className="w-full md:w-80 bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-50 md:hidden">
        {workers.length > 0 ? workers.map((item) => (
          <article key={item._id} className="space-y-4 p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <img src={item.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900 break-words">{item.user?.name}</p>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'worker' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {formatRoleLabel(t, item.type)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500 break-all">{item.user?.email}</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Clock size={16} className="shrink-0" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectWorker(item)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
            >
              <Eye size={16} /> {t('admin.reviewKyc')}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onApprove(item._id, 'approved')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white"
              >
                <CheckCircle size={18} /> {t('admin.approve')}
              </button>
              <button
                onClick={() => onSelectWorker(item)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
              >
                <XCircle size={18} /> {t('admin.reject')}
              </button>
            </div>
          </article>
        )) : (
          <div className="px-8 py-20 text-center">
            <div className="max-w-xs mx-auto space-y-2">
              <p className="font-bold text-slate-300 text-lg italic">{t('admin.queueClear')}</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('admin.queueClearHint')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
              <th className="px-8 py-5">{t('admin.applicantDetails')}</th>
              <th className="px-8 py-5">{t('admin.type')}</th>
              <th className="px-8 py-5">{t('admin.appliedDate')}</th>
              <th className="px-8 py-5">{t('admin.documents')}</th>
              <th className="px-8 py-5 text-right">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {workers.length > 0 ? workers.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={item.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
                    <div>
                      <p className="font-bold text-slate-900">{item.user?.name}</p>
                      <p className="text-xs font-semibold text-slate-400">{item.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'worker' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {formatRoleLabel(t, item.type)}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                    <Clock size={16} /> {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <button
                    onClick={() => onSelectWorker(item)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Eye size={14} /> {t('admin.reviewKyc')}
                  </button>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onApprove(item._id, 'approved')}
                      className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                      title={t('admin.approve')}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => onSelectWorker(item)}
                      className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                      title={t('admin.reject')}
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-bold text-slate-300 text-lg italic">{t('admin.queueClear')}</p>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('admin.queueClearHint')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const VerificationReviewModal = ({ worker, rejectionReason, onRejectionReasonChange, onClose, onApprove, onReject }) => {
  const { t } = useTranslation();

  if (!worker) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl rounded-3xl md:rounded-[40px] premium-shadow overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-4 sm:p-8 border-b border-slate-50 flex justify-between items-center gap-4">
          <div>
            <h3 className="text-lg sm:text-2xl font-bold font-heading text-slate-900">{t('admin.reviewIdentity', { name: worker.user?.name })}</h3>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] uppercase font-black">{t('admin.accountBadge', { type: formatRoleLabel(t, worker.type) })}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors" aria-label={t('bookingDetails.close')}>
            <XCircle className="text-slate-400" size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-10 grid md:grid-cols-2 gap-6 sm:gap-10">
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.uploadedIdProof')}</p>
            <div className="aspect-4/3 rounded-3xl overflow-hidden border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
              <DocumentPreview url={worker.kyc?.idProof?.url} label={t('admin.uploadedIdProof')} />
            </div>
          </div>

          {worker.type === 'worker' && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.uploadedSelfie')}</p>
              <div className="aspect-4/3 rounded-3xl overflow-hidden border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
                <DocumentPreview url={worker.kyc?.selfie?.url} label={t('admin.uploadedSelfie')} />
              </div>
            </div>
          )}

          <div className="md:col-span-2 space-y-4 pt-6 border-t border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.rejectionReasonLabel')}</p>
            <textarea
              value={rejectionReason}
              onChange={(event) => onRejectionReasonChange(event.target.value)}
              placeholder={t('admin.rejectionPlaceholder')}
              className="w-full h-32 bg-slate-50 border border-slate-100 p-6 rounded-3xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="p-4 sm:p-10 bg-slate-50/50 flex flex-col md:flex-row gap-4 border-t border-slate-100">
          <button
            onClick={onApprove}
            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all premium-shadow"
          >
            {t('admin.approveIdentity')}
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all premium-shadow"
          >
            {t('admin.rejectIdentity')}
          </button>
        </div>
      </div>
    </div>
  );
};

const DirectoryCardShell = ({ children }) => (
  <article className="space-y-4 border-b border-slate-50 p-4 sm:p-6 last:border-b-0">
    {children}
  </article>
);

const DirectoryMeta = ({ label, children }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <div className="text-sm font-medium text-slate-600">{children}</div>
  </div>
);

const EmptyCards = ({ message }) => (
  <div className="px-8 py-20 text-center text-slate-300 font-bold italic md:hidden">{message}</div>
);

const EmptyTable = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="px-8 py-20 text-center text-slate-300 font-bold italic">{message}</td>
  </tr>
);

const UsersCards = ({ users, onDelete }) => {
  const { t } = useTranslation();

  if (!users.length) {
    return <EmptyCards message={t('admin.noUsersFound')} />;
  }

  return (
    <div className="divide-y divide-slate-50 md:hidden">
      {users.map((user) => (
        <DirectoryCardShell key={user._id}>
          <div className="flex items-start gap-4">
            <img src={user.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 break-words">{user.name}</p>
              <p className="mt-1 text-sm font-medium text-slate-500 break-all">{user.email}</p>
              <p className="mt-2 text-sm font-bold text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DirectoryMeta label={t('admin.contact')}>
              <div className="space-y-1">
                <p className="break-all">{user.email}</p>
                <p>{user.phone || t('common.notAdded')}</p>
              </div>
            </DirectoryMeta>
            <DirectoryMeta label={t('admin.location')}>
              <p className="break-words">{user.location?.address || user.location?.city || t('common.notAdded')}</p>
            </DirectoryMeta>
          </div>

          <DirectoryMeta label={t('admin.verification')}>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={user.isVerified ? 'verified' : 'pending'}>{user.isVerified ? t('admin.emailVerified') : t('admin.emailPending')}</StatusBadge>
              <StatusBadge status={user.isAdminApproved ? 'approved' : user.kyc?.status || 'pending'}>{user.isAdminApproved ? t('admin.adminApproved') : getTranslatedStatus(t, user.kyc?.status || 'pending', t('admin.kycPending'))}</StatusBadge>
            </div>
          </DirectoryMeta>

          <button
            type="button"
            onClick={() => onDelete({ tab: 'users', id: user._id, name: user.name })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-600 hover:text-white"
          >
            <Trash2 size={16} /> {t('admin.delete')}
          </button>
        </DirectoryCardShell>
      ))}
    </div>
  );
};

const UsersTable = ({ users, onDelete }) => {
  const { t } = useTranslation();

  return (
    <>
      <UsersCards users={users} onDelete={onDelete} />
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
              <th className="px-8 py-5">{t('admin.user')}</th>
              <th className="px-8 py-5">{t('admin.contact')}</th>
              <th className="px-8 py-5">{t('admin.verification')}</th>
              <th className="px-8 py-5">{t('admin.location')}</th>
              <th className="px-8 py-5">{t('admin.joined')}</th>
              <th className="px-8 py-5 text-right">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.length ? users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/30">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs font-semibold text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600">{user.phone || t('common.notAdded')}</td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={user.isVerified ? 'verified' : 'pending'}>{user.isVerified ? t('admin.emailVerified') : t('admin.emailPending')}</StatusBadge>
                    <StatusBadge status={user.isAdminApproved ? 'approved' : user.kyc?.status || 'pending'}>{user.isAdminApproved ? t('admin.adminApproved') : getTranslatedStatus(t, user.kyc?.status || 'pending', t('admin.kycPending'))}</StatusBadge>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-medium text-slate-500 max-w-xs break-words">{user.location?.address || user.location?.city || t('common.notAdded')}</td>
                <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-6 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete({ tab: 'users', id: user._id, name: user.name })}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 size={14} /> {t('admin.delete')}
                  </button>
                </td>
              </tr>
            )) : (
              <EmptyTable colSpan={6} message={t('admin.noUsersFound')} />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

const WorkersCards = ({ workers, onDelete }) => {
  const { t } = useTranslation();

  if (!workers.length) {
    return <EmptyCards message={t('admin.noWorkersFound')} />;
  }

  return (
    <div className="divide-y divide-slate-50 md:hidden">
      {workers.map((worker) => (
        <DirectoryCardShell key={worker._id}>
          <div className="flex items-start gap-4">
            <img src={worker.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-slate-900 break-words">{worker.user?.name || t('admin.unknownWorker')}</p>
                <StatusBadge status={worker.approvalStatus}>{getTranslatedStatus(t, worker.approvalStatus, worker.approvalStatus)}</StatusBadge>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500 break-all">{worker.user?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DirectoryMeta label={t('admin.skills')}>
              <div className="flex flex-wrap gap-2">
                {worker.skills?.length ? worker.skills.slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                    {t(`services.${skill}`, { defaultValue: skill })}
                  </span>
                )) : <span>{t('common.notAdded')}</span>}
              </div>
            </DirectoryMeta>
            <DirectoryMeta label={t('admin.availability')}>
              <StatusBadge status={worker.availabilityStatus}>{getAvailabilityLabel(t, worker.availabilityStatus || 'Available')}</StatusBadge>
            </DirectoryMeta>
          </div>

          <DirectoryMeta label={t('admin.rating')}>
            <span className="font-bold text-slate-600">{worker.averageRating?.toFixed(1) || '0.0'} ({worker.totalReviews || 0})</span>
          </DirectoryMeta>

          <button
            type="button"
            onClick={() => onDelete({ tab: 'workers', id: worker._id, name: worker.user?.name })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-600 hover:text-white"
          >
            <Trash2 size={16} /> {t('admin.delete')}
          </button>
        </DirectoryCardShell>
      ))}
    </div>
  );
};

const WorkersTable = ({ workers, onDelete }) => {
  const { t } = useTranslation();

  return (
    <>
      <WorkersCards workers={workers} onDelete={onDelete} />
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
              <th className="px-8 py-5">{t('admin.worker')}</th>
              <th className="px-8 py-5">{t('admin.skills')}</th>
              <th className="px-8 py-5">{t('admin.status')}</th>
              <th className="px-8 py-5">{t('admin.availability')}</th>
              <th className="px-8 py-5">{t('admin.rating')}</th>
              <th className="px-8 py-5 text-right">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {workers.length ? workers.map((worker) => (
              <tr key={worker._id} className="hover:bg-slate-50/30">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={worker.user?.avatar || fallbackAvatar} onError={withImageFallback()} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-100" />
                    <div>
                      <p className="font-bold text-slate-900">{worker.user?.name || t('admin.unknownWorker')}</p>
                      <p className="text-xs font-semibold text-slate-400">{worker.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {worker.skills?.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                        {t(`services.${skill}`, { defaultValue: skill })}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-6"><StatusBadge status={worker.approvalStatus}>{getTranslatedStatus(t, worker.approvalStatus, worker.approvalStatus)}</StatusBadge></td>
                <td className="px-8 py-6"><StatusBadge status={worker.availabilityStatus}>{getAvailabilityLabel(t, worker.availabilityStatus || 'Available')}</StatusBadge></td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600">{worker.averageRating?.toFixed(1) || '0.0'} ({worker.totalReviews || 0})</td>
                <td className="px-8 py-6 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete({ tab: 'workers', id: worker._id, name: worker.user?.name })}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 size={14} /> {t('admin.delete')}
                  </button>
                </td>
              </tr>
            )) : (
              <EmptyTable colSpan={6} message={t('admin.noWorkersFound')} />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

const BookingsCards = ({ bookings }) => {
  const { t } = useTranslation();

  if (!bookings.length) {
    return <EmptyCards message={t('admin.noBookingsFound')} />;
  }

  return (
    <div className="divide-y divide-slate-50 md:hidden">
      {bookings.map((booking) => (
        <DirectoryCardShell key={booking._id}>
          <div className="flex items-start gap-3">
            <Briefcase className="mt-1 shrink-0 text-primary-500" size={18} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 break-words">{booking.service}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{formatInr(booking.totalPrice)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DirectoryMeta label={t('admin.customer')}>
              <span>{booking.user?.name || t('common.unknown')}</span>
            </DirectoryMeta>
            <DirectoryMeta label={t('admin.worker')}>
              <span>{booking.worker?.name || t('common.unknown')}</span>
            </DirectoryMeta>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DirectoryMeta label={t('admin.status')}>
              <StatusBadge status={booking.status}>{getTranslatedStatus(t, booking.status, booking.status)}</StatusBadge>
            </DirectoryMeta>
            <DirectoryMeta label={t('admin.payment')}>
              <StatusBadge status={booking.paymentStatus}>{getTranslatedStatus(t, booking.paymentStatus, booking.paymentStatus)}</StatusBadge>
            </DirectoryMeta>
          </div>

          <DirectoryMeta label={t('admin.schedule')}>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <CalendarDays size={16} className="shrink-0" />
              <span>{new Date(booking.scheduledDate).toLocaleString()}</span>
            </div>
          </DirectoryMeta>
        </DirectoryCardShell>
      ))}
    </div>
  );
};

const BookingsTable = ({ bookings }) => {
  const { t } = useTranslation();

  return (
    <>
      <BookingsCards bookings={bookings} />
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold">
              <th className="px-8 py-5">{t('admin.service')}</th>
              <th className="px-8 py-5">{t('admin.customer')}</th>
              <th className="px-8 py-5">{t('admin.worker')}</th>
              <th className="px-8 py-5">{t('admin.status')}</th>
              <th className="px-8 py-5">{t('admin.payment')}</th>
              <th className="px-8 py-5">{t('admin.schedule')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.length ? bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-slate-50/30">
                <td className="px-8 py-6">
                  <div className="flex items-start gap-3">
                    <Briefcase className="mt-1 text-primary-500" size={18} />
                    <div>
                      <p className="font-bold text-slate-900">{booking.service}</p>
                      <p className="text-xs font-semibold text-slate-400">{formatInr(booking.totalPrice)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600">{booking.user?.name || t('common.unknown')}</td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600">{booking.worker?.name || t('common.unknown')}</td>
                <td className="px-8 py-6"><StatusBadge status={booking.status}>{getTranslatedStatus(t, booking.status, booking.status)}</StatusBadge></td>
                <td className="px-8 py-6"><StatusBadge status={booking.paymentStatus}>{getTranslatedStatus(t, booking.paymentStatus, booking.paymentStatus)}</StatusBadge></td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                    <CalendarDays size={16} /> {new Date(booking.scheduledDate).toLocaleString()}
                  </div>
                </td>
              </tr>
            )) : (
              <EmptyTable colSpan={6} message={t('admin.noBookingsFound')} />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export const AdminDirectory = ({ activeTab, data, loading, pagination, searchTerm, setSearchTerm, onSearch, onPageChange, onCreate, onDelete }) => {
  const { t } = useTranslation();
  const titles = {
    users: t('admin.registeredUsers'),
    workers: t('admin.registeredWorkers'),
    bookings: t('admin.platformBookings')
  };
  const placeholders = {
    users: t('admin.searchUsers'),
    workers: t('admin.searchWorkers'),
    bookings: t('admin.searchBookings')
  };
  const addLabel = activeTab === 'users' ? t('admin.addUser') : t('admin.addWorker');

  return (
    <section className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
      <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 font-heading">{titles[activeTab]}</h3>
          <p className="text-sm font-medium text-slate-500">{t('admin.directorySubtitle')}</p>
        </div>
        <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
          {activeTab !== 'bookings' && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus size={18} /> {addLabel}
            </button>
          )}
          <form onSubmit={onSearch} className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={placeholders[activeTab]}
              className="w-full md:w-96 bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium"
            />
          </form>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="px-8 py-20 text-center text-slate-400 font-bold">{t('admin.loadingRecords')}</div>
        ) : activeTab === 'users' ? (
          <UsersTable users={data} onDelete={onDelete} />
        ) : activeTab === 'workers' ? (
          <WorkersTable workers={data} onDelete={onDelete} />
        ) : (
          <BookingsTable bookings={data} />
        )}
      </div>

      {pagination?.pages > 1 && (
        <div className="flex flex-wrap justify-center gap-3 border-t border-slate-50 p-4">
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">{t('common.previous')}</button>
          <span className="px-5 py-3 text-slate-500 font-bold">{t('admin.pageInfo', { page: pagination.page, pages: pagination.pages })}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} className="px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold disabled:opacity-40">{t('common.next')}</button>
        </div>
      )}
    </section>
  );
};

export const AuditLogSection = ({ logs }) => {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 overflow-hidden">
      <div className="p-4 sm:p-8 border-b border-slate-50">
        <h3 className="text-2xl font-bold text-slate-900 font-heading">{t('admin.auditTab')}</h3>
        <p className="text-slate-500">{t('admin.auditSubtitle')}</p>
      </div>
      <div className="divide-y divide-slate-50">
        {logs.length === 0 ? (
          <p className="p-8 text-slate-400 font-bold italic">{t('admin.noAudit')}</p>
        ) : logs.map((log) => (
          <div key={log._id} className="p-4 sm:p-6 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{log.action}</p>
              <p className="text-sm text-slate-500">{log.actor?.name || t('common.system')} - {log.entityType}</p>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const DeleteAccountModal = ({ item, saving, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const [confirmation, setConfirmation] = useState('');
  const label = formatRoleLabel(t, item.tab === 'users' ? 'user' : 'worker');
  const targetName = item.name || t('admin.thisAccount', { label });
  const canConfirm = confirmation.trim().toUpperCase() === t('admin.deleteConfirmWord').toUpperCase();

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="font-heading text-2xl font-bold text-slate-900">
              {t('admin.deleteTitle', { label })}
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {t('admin.deleteWarning', { name: targetName })}
            </p>
          </div>
        </div>

        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
          {t('admin.typeDelete')}
        </label>
        <input
          autoFocus
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={t('admin.deleteConfirmWord')}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 outline-none focus:border-rose-400 focus:bg-white"
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || saving}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('admin.deleting') : t('admin.confirmDelete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ManagedAccountModal = ({ type, form, setForm, saving, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const isWorker = type === 'workers';
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const label = formatRoleLabel(t, isWorker ? 'worker' : 'user');

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white premium-shadow">
        <div className="flex items-center justify-between gap-4 border-b border-slate-50 p-4 sm:p-8">
          <div>
            <h3 className="text-2xl font-bold font-heading text-slate-900">{t('admin.addAccountTitle', { label })}</h3>
            <p className="text-sm font-medium text-slate-500">{t('admin.addAccountSubtitle')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50" aria-label={t('common.cancel')}>
            <XCircle size={24} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-8">
          <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder={t('admin.fullNamePlaceholder')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder={t('admin.emailPlaceholder')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input required minLength={6} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder={t('admin.temporaryPassword')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder={t('admin.phonePlaceholder')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder={t('admin.addressPlaceholder')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none sm:col-span-2" />
          <input value={form.city} onChange={(event) => updateField('city', event.target.value)} placeholder={t('admin.cityPlaceholder')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
          <input value={form.pincode} onChange={(event) => updateField('pincode', event.target.value)} placeholder={t('admin.pincodePlaceholder')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />

          {isWorker && (
            <>
              <input required value={form.skills} onChange={(event) => updateField('skills', event.target.value)} placeholder={t('admin.skillsPlaceholder', { skills: PROFESSIONS.slice(0, 3).join(', ') })} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none sm:col-span-2" />
              <input type="number" min="0" value={form.experience} onChange={(event) => updateField('experience', event.target.value)} placeholder={t('admin.experienceYears')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
              <input type="number" min="0" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} placeholder={t('admin.priceAmount')} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none" />
              <select value={form.unit} onChange={(event) => updateField('unit', event.target.value)} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none">
                <option value="hour">{t('admin.perHour')}</option>
                <option value="day">{t('admin.perDay')}</option>
                <option value="job">{t('admin.perJob')}</option>
              </select>
              <textarea required value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder={t('admin.workerBioPlaceholder')} className="h-28 rounded-2xl bg-slate-50 px-4 py-3 outline-none sm:col-span-2" />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-50 bg-slate-50/60 p-4 sm:flex-row sm:p-8">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 py-3 font-bold text-slate-600">{t('common.cancel')}</button>
          <button disabled={saving} className="flex-1 rounded-2xl bg-primary-600 py-3 font-bold text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? t('admin.saving') : t('admin.saveAccount', { label })}
          </button>
        </div>
      </form>
    </div>
  );
};
