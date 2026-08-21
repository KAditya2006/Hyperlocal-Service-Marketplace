import { useCallback, useEffect, useState } from 'react';
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
  Users,
  Shield
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
  VerificationQueue,
  VerificationReviewModal
} from '../components/admin/AdminDashboardSections';
import { StatCard } from '../components/cards/StatCard';
import { Tabs } from '../components/ui/Tabs';

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
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center font-heading text-slate-400 font-bold">
          {t('admin.loadingDashboard')}
        </div>
      </div>
    );
  }

  const filteredWorkers = pendingWorkers.filter((worker) => {
    const haystack = `${worker.user?.name || ''} ${worker.user?.email || ''}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 min-w-0">
        {/* Header & Tabs */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-100">
              <Shield size={13} />
              <span>Platform Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('admin.platformControl')}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">{t('admin.platformSubtitle')}</p>
          </div>

          <Tabs
            activeTab={activeTab}
            onChange={(tab) => {
              if (LIST_TABS.includes(tab)) {
                openDirectory(tab);
              } else {
                setActiveTab(tab);
              }
            }}
            tabs={[
              { key: 'overview', label: t('admin.overviewTab') },
              { key: 'users', label: t('admin.usersTab') },
              { key: 'workers', label: t('admin.workersTab') },
              { key: 'bookings', label: t('admin.bookingsTab') },
              { key: 'audit', label: t('admin.auditTab') }
            ]}
          />
        </header>

        {/* Overview Stats */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title={t('admin.totalUsers')}
              value={stats?.totalUsers || 0}
              icon={Users}
              trend={t('admin.viewList')}
              onClick={() => openDirectory('users')}
            />
            <StatCard
              title={t('admin.totalWorkers')}
              value={stats?.totalWorkers || 0}
              icon={TrendingUp}
              trend={t('admin.viewList')}
              onClick={() => openDirectory('workers')}
            />
            <StatCard
              title={t('admin.pendingKyc')}
              value={stats?.pendingApprovals || 0}
              icon={ShieldAlert}
              trend={pendingWorkers.length > 5 ? t('admin.high') : t('admin.normal')}
              trendPositive={pendingWorkers.length <= 5}
              onClick={() => document.getElementById('verification-queue')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <StatCard
              title={t('admin.paidBookings')}
              value={stats?.paidBookings || 0}
              icon={CheckCircle}
              subtitle={t('admin.totalCount', { count: stats?.totalBookings || 0 })}
              onClick={() => openDirectory('bookings')}
            />
          </div>
        )}

        {/* Verification Queue in Overview */}
        {activeTab === 'overview' && (
          <VerificationQueue
            workers={filteredWorkers}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSelectWorker={setSelectedWorker}
            onApprove={handleApproval}
          />
        )}

        {/* Directory Tables */}
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

        {/* Audit Log Tab */}
        {activeTab === 'audit' && <AuditLogSection logs={auditLogs} />}

        {/* Review Modal */}
        <VerificationReviewModal
          worker={selectedWorker}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onClose={() => setSelectedWorker(null)}
          onApprove={() => handleApproval(selectedWorker?._id, 'approved')}
          onReject={() => handleApproval(selectedWorker?._id, 'rejected')}
        />

        {/* Create Modal */}
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

        {/* Delete Modal */}
        {pendingDelete && (
          <DeleteAccountModal
            item={pendingDelete}
            saving={deletingAccount}
            onCancel={() => setPendingDelete(null)}
            onConfirm={confirmDeleteAccount}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
