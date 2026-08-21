import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  approveWorker,
  createAdminUser,
  createAdminWorker,
  deleteAdminUser,
  deleteAdminWorker,
  getAdminBookings,
  getAdminStats,
  getAdminUsers,
  getAdminWorkers,
  getAuditLogs,
  getPendingWorkers
} from '../services/api';
import Navbar from '../components/Navbar';
import {
  CheckCircle,
  ShieldAlert,
  TrendingUp,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AdminDirectory,
  AuditLogSection,
  DeleteAccountModal,
  EMPTY_MANAGED_ACCOUNT_FORM,
  formatRoleLabel,
  LIST_TABS,
  ManagedAccountModal,
  StatCard,
  VerificationQueue,
  VerificationReviewModal
} from '../components/admin/AdminDashboardSections';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directories, setDirectories] = useState({
    users: [],
    workers: [],
    bookings: []
  });
  const [directoryPagination, setDirectoryPagination] = useState({
    users: { page: 1, pages: 1 },
    workers: { page: 1, pages: 1 },
    bookings: { page: 1, pages: 1 }
  });
  const [createModal, setCreateModal] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_MANAGED_ACCOUNT_FORM);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, workersRes] = await Promise.all([
        getAdminStats(),
        getPendingWorkers()
      ]);
      setStats(statsRes.data.data);
      setPendingWorkers(workersRes.data.data);
      const logsRes = await getAuditLogs();
      setAuditLogs(logsRes.data.data);
    } catch {
      toast.error(t('admin.failedLoadData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!LIST_TABS.includes(activeTab)) return;

    const fetchInitialDirectory = async () => {
      setDirectoryLoading(true);
      try {
        const endpoint = activeTab === 'users'
          ? getAdminUsers
          : activeTab === 'workers'
            ? getAdminWorkers
            : getAdminBookings;
        const { data } = await endpoint({ page: 1, limit: 20 });
        setDirectories((current) => ({ ...current, [activeTab]: data.data }));
        setDirectoryPagination((current) => ({ ...current, [activeTab]: data.pagination }));
      } catch {
        toast.error(t('admin.failedLoadList'));
      } finally {
        setDirectoryLoading(false);
      }
    };

    setDirectorySearch('');
    fetchInitialDirectory();
  }, [activeTab, t]);

  const fetchDirectory = async (tab = activeTab, page = 1, search = directorySearch) => {
    if (!LIST_TABS.includes(tab)) return;

    setDirectoryLoading(true);
    try {
      const endpoint = tab === 'users' ? getAdminUsers : tab === 'workers' ? getAdminWorkers : getAdminBookings;
      const { data } = await endpoint({ page, limit: 20, search });
      setDirectories((current) => ({ ...current, [tab]: data.data }));
      setDirectoryPagination((current) => ({ ...current, [tab]: data.pagination }));
    } catch {
      toast.error(t('admin.failedLoadList'));
    } finally {
      setDirectoryLoading(false);
    }
  };

  const openDirectory = (tab) => {
    setDirectorySearch('');
    setActiveTab(tab);
  };

  const openCreateModal = (tab) => {
    setCreateModal(tab);
    setCreateForm(EMPTY_MANAGED_ACCOUNT_FORM);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!createModal) return;

    setCreatingAccount(true);
    try {
      const payload = {
        ...createForm,
        skills: createForm.skills,
        experience: Number(createForm.experience) || 0,
        amount: Number(createForm.amount) || 0
      };

      const { data } = createModal === 'users'
        ? await createAdminUser(payload)
        : await createAdminWorker(payload);

      toast.success(data.message);
      setCreateModal(null);
      setCreateForm(EMPTY_MANAGED_ACCOUNT_FORM);
      await fetchData();
      await fetchDirectory(createModal, 1, '');
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.couldNotAddAccount'));
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleDeleteAccount = ({ tab, id, name }) => {
    setPendingDelete({ tab, id, name });
  };

  const confirmDeleteAccount = async () => {
    if (!pendingDelete) return;
    const { tab, id } = pendingDelete;
    const label = formatRoleLabel(t, tab === 'users' ? 'user' : 'worker');

    setDeletingAccount(true);
    try {
      const { data } = tab === 'users'
        ? await deleteAdminUser(id)
        : await deleteAdminWorker(id);

      toast.success(data.message);
      setPendingDelete(null);
      await fetchData();
      await fetchDirectory(tab, directoryPagination[tab]?.page || 1, directorySearch);
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.deleteFailed', { label }));
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleApproval = async (workerId, status) => {
    if (status === 'rejected' && !rejectionReason) {
      toast.error(t('admin.reasonRequired'));
      return;
    }

    try {
      const { data } = await approveWorker({
        workerId,
        status,
        rejectionReason,
        type: selectedWorker?.type || pendingWorkers.find((worker) => worker._id === workerId)?.type
      });
      toast.success(data.message);
      setSelectedWorker(null);
      setRejectionReason('');
      fetchData();
    } catch {
      toast.error(t('admin.actionFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-heading text-slate-400">
        {t('admin.loadingDashboard')}
      </div>
    );
  }

  const filteredWorkers = pendingWorkers.filter((worker) => {
    const haystack = `${worker.user?.name || ''} ${worker.user?.email || ''}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 min-w-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-w-0">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 tracking-tight">{t('admin.platformControl')}</h1>
            <p className="text-slate-500 font-medium">{t('admin.platformSubtitle')}</p>
          </div>
          <div className="flex w-full sm:w-auto max-w-full overflow-x-auto bg-white p-1 rounded-2xl premium-shadow border border-slate-100">
            <button onClick={() => setActiveTab('overview')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t('admin.overviewTab')}</button>
            <button onClick={() => openDirectory('users')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t('admin.usersTab')}</button>
            <button onClick={() => openDirectory('workers')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'workers' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t('admin.workersTab')}</button>
            <button onClick={() => openDirectory('bookings')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'bookings' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t('admin.bookingsTab')}</button>
            <button onClick={() => setActiveTab('audit')} className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t('admin.auditTab')}</button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users className="text-blue-500" />} label={t('admin.totalUsers')} value={stats?.totalUsers} change={t('admin.viewList')} color="bg-blue-50" onClick={() => openDirectory('users')} />
            <StatCard icon={<TrendingUp className="text-emerald-500" />} label={t('admin.totalWorkers')} value={stats?.totalWorkers} change={t('admin.viewList')} color="bg-emerald-50" onClick={() => openDirectory('workers')} />
            <StatCard icon={<ShieldAlert className="text-amber-500" />} label={t('admin.pendingKyc')} value={stats?.pendingApprovals} change={pendingWorkers.length > 5 ? t('admin.high') : t('admin.normal')} color="bg-amber-50" onClick={() => document.getElementById('verification-queue')?.scrollIntoView({ behavior: 'smooth' })} />
            <StatCard icon={<CheckCircle className="text-indigo-500" />} label={t('admin.paidBookings')} value={stats?.paidBookings} change={t('admin.totalCount', { count: stats?.totalBookings || 0 })} color="bg-indigo-50" onClick={() => openDirectory('bookings')} />
          </div>
        )}

        {activeTab === 'overview' && (
          <VerificationQueue
            workers={filteredWorkers}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSelectWorker={setSelectedWorker}
            onApprove={handleApproval}
          />
        )}

        {LIST_TABS.includes(activeTab) && (
          <AdminDirectory
            activeTab={activeTab}
            data={directories[activeTab]}
            loading={directoryLoading}
            pagination={directoryPagination[activeTab]}
            searchTerm={directorySearch}
            setSearchTerm={setDirectorySearch}
            onSearch={(event) => {
              event.preventDefault();
              fetchDirectory(activeTab, 1, directorySearch);
            }}
            onPageChange={(page) => fetchDirectory(activeTab, page, directorySearch)}
            onCreate={() => openCreateModal(activeTab)}
            onDelete={handleDeleteAccount}
          />
        )}

        {activeTab === 'audit' && <AuditLogSection logs={auditLogs} />}

        <VerificationReviewModal
          worker={selectedWorker}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onClose={() => setSelectedWorker(null)}
          onApprove={() => handleApproval(selectedWorker?._id, 'approved')}
          onReject={() => handleApproval(selectedWorker?._id, 'rejected')}
        />

        {createModal && (
          <ManagedAccountModal
            type={createModal}
            form={createForm}
            setForm={setCreateForm}
            saving={creatingAccount}
            onSubmit={handleCreateSubmit}
            onClose={() => setCreateModal(null)}
          />
        )}

        {pendingDelete && (
          <DeleteAccountModal
            item={pendingDelete}
            saving={deletingAccount}
            onCancel={() => setPendingDelete(null)}
            onConfirm={confirmDeleteAccount}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
