import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { reportApi } from '../../api/attendance.api';
import { metaApi, employeeApi } from '../../api/employee.api';
import { useFetch } from '../../hooks/useFetch.js';
import Card from '../../components/common/Card.jsx';
import Table from '../../components/common/Table.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { Select } from '../../components/common/FormControls.jsx';
import { todayISO } from '../../utils/format.js';

const Reports = () => {
  const [range, setRange] = useState('daily');
  const [date, setDate] = useState(todayISO());
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    metaApi.departments().then((r) => setDepartments(r.data.data.departments)).catch(() => {});
    employeeApi.list({ limit: 100 }).then((r) => setEmployees(r.data.data.employees)).catch(() => {});
  }, []);

  const params = { range, date, departmentId: departmentId || undefined, userId: userId || undefined };

  const fetcher = useCallback(
    () => reportApi.get(params).then((r) => r.data.data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, date, departmentId, userId]
  );
  const { data, loading } = useFetch(fetcher, [fetcher]);

  const exportParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));

  const columns = [
    { key: 'employeeCode', header: 'ID' },
    { key: 'fullName', header: 'Name' },
    { key: 'department', header: 'Department' },
    { key: 'date', header: 'Date' },
    { key: 'checkIn', header: 'Check In' },
    { key: 'checkOut', header: 'Check Out' },
    { key: 'workingHours', header: 'Hours' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate and export attendance reports</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Select label="Range" value={range} onChange={(e) => setRange(e.target.value)} className="w-36">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
          <div>
            <label className="label">Reference date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-44">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Select label="Employee" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-48">
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </Select>

          <div className="ml-auto flex gap-2">
            <a href={reportApi.exportExcelUrl(exportParams)} className="btn-secondary">
              <FileSpreadsheet size={16} /> Excel
            </a>
            <a href={reportApi.exportPdfUrl(exportParams)} className="btn-secondary">
              <FileText size={16} /> PDF
            </a>
          </div>
        </div>

        {data && (
          <p className="mb-3 text-sm text-slate-500">
            Showing {data.totalRecords} record(s) from {data.startDate} to {data.endDate}
          </p>
        )}

        <Table columns={columns} rows={data?.records} loading={loading} emptyMessage="No records for the selected range" />
      </Card>
    </div>
  );
};

export default Reports;
