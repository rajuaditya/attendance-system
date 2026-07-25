import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Power, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeApi, metaApi } from '../../api/employee.api';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import Card from '../../components/common/Card.jsx';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { Input, Select, Button } from '../../components/common/FormControls.jsx';
import { formatDate } from '../../utils/format.js';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  role: 'employee',
  departmentId: '',
  designationId: '',
  dateOfJoining: '',
  password: '',
};

const Employees = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    metaApi.departments().then((r) => setDepartments(r.data.data.departments)).catch(() => {});
    metaApi.designations().then((r) => setDesignations(r.data.data.designations)).catch(() => {});
  }, []);

  const fetcher = useCallback(
    () => employeeApi.list({ search, status: statusFilter, page, limit: 15 }).then((r) => r.data.data),
    [search, statusFilter, page]
  );
  const { data, loading, refetch } = useFetch(fetcher, [fetcher]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingId(emp.id);
    setForm({
      fullName: emp.full_name,
      email: emp.email,
      phone: emp.phone || '',
      role: emp.role,
      departmentId: emp.department_id || '',
      designationId: emp.designation_id || '',
      dateOfJoining: emp.date_of_joining || '',
      password: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await employeeApi.update(editingId, form);
        toast.success('Employee updated');
      } else {
        await employeeApi.create(form);
        toast.success('Employee created');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    try {
      await employeeApi.toggleStatus(emp.id);
      toast.success(`${emp.full_name} ${emp.is_active ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Permanently delete ${emp.full_name}? This cannot be undone.`)) return;
    try {
      await employeeApi.remove(emp.id);
      toast.success('Employee deleted');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleViewQr = async (emp) => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrData(null);
    try {
      const { data: res } = await employeeApi.getQrCode(emp.id);
      setQrData({ ...res.data, employee: emp });
    } catch (err) {
      toast.error('Failed to load QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleRotateQr = async () => {
    if (!qrData?.employee) return;
    setQrLoading(true);
    try {
      const { data: res } = await employeeApi.rotateQrCode(qrData.employee.id);
      setQrData({ ...res.data, employee: qrData.employee });
      toast.success('QR code rotated');
    } catch (err) {
      toast.error('Failed to rotate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const columns = [
    { key: 'employee_code', header: 'ID' },
    {
      key: 'full_name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{row.full_name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Department', render: (row) => row.Department?.name || '-' },
    { key: 'designation', header: 'Designation', render: (row) => row.Designation?.title || '-' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
    { key: 'role', header: 'Role', render: (row) => <span className="capitalize">{row.role.replace('_', ' ')}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleViewQr(row)} title="View QR" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800">
            <QrCode size={16} />
          </button>
          <button onClick={() => openEditModal(row)} title="Edit" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800">
            <Pencil size={16} />
          </button>
          {row.id !== currentUser.id && (
            <button onClick={() => handleToggleStatus(row)} title={row.is_active ? 'Deactivate' : 'Activate'} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800">
              <Power size={16} />
            </button>
          )}
          {currentUser.role === 'super_admin' && row.id !== currentUser.id && (
            <button onClick={() => handleDelete(row)} title="Delete" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-status-absent dark:hover:bg-slate-800">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Employees</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your team, roles, and QR access</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, email, or ID…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="w-40">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <Table columns={columns} rows={data?.employees} loading={loading} emptyMessage="No employees found" />

        {data?.pagination && data.pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} employees)
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="rounded-lg bg-status-absent/10 px-3 py-2 text-sm text-status-absent">{formError}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={!!editingId}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </Select>
            <Select label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select label="Designation" value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })}>
              <option value="">Select designation</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </Select>
            <Input label="Date of joining" type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            {!editingId && (
              <Input
                label="Temporary password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 chars, mixed case, number, symbol"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingId ? 'Save changes' : 'Create employee'}</Button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title={`QR Code — ${qrData?.employee?.full_name || ''}`} size="sm">
        <div className="flex flex-col items-center gap-4">
          {qrLoading || !qrData ? (
            <div className="py-10"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" /></div>
          ) : (
            <>
              <img src={qrData.qrImageDataUrl} alt="Employee QR code" className="h-56 w-56 rounded-xl border border-slate-100 dark:border-slate-800" />
              <p className="text-xs text-slate-400">Expires {formatDate(qrData.expiresAt)}</p>
              <div className="flex gap-2">
                <a href={qrData.qrImageDataUrl} download={`${qrData.employee.employee_code}-qr.png`} className="btn-secondary">
                  Download
                </a>
                <Button variant="secondary" onClick={handleRotateQr}>Rotate QR</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
