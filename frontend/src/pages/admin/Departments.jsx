import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { metaApi } from '../../api/employee.api';
import Card from '../../components/common/Card.jsx';
import { Input, Button } from '../../components/common/FormControls.jsx';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [savingDept, setSavingDept] = useState(false);
  const [savingDesig, setSavingDesig] = useState(false);

  const load = () => {
    metaApi.departments().then((r) => setDepartments(r.data.data.departments));
    metaApi.designations().then((r) => setDesignations(r.data.data.designations));
  };

  useEffect(() => {
    load();
  }, []);

  const addDepartment = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    setSavingDept(true);
    try {
      await metaApi.createDepartment({ name: newDept.trim() });
      setNewDept('');
      toast.success('Department added');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add department');
    } finally {
      setSavingDept(false);
    }
  };

  const addDesignation = async (e) => {
    e.preventDefault();
    if (!newDesig.trim()) return;
    setSavingDesig(true);
    try {
      await metaApi.createDesignation({ title: newDesig.trim() });
      setNewDesig('');
      toast.success('Designation added');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add designation');
    } finally {
      setSavingDesig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Departments & Designations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage the org structure used across employee profiles</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Departments">
          <form onSubmit={addDepartment} className="mb-4 flex gap-2">
            <Input placeholder="e.g. Customer Success" value={newDept} onChange={(e) => setNewDept(e.target.value)} className="flex-1" />
            <Button type="submit" loading={savingDept}><Plus size={16} /> Add</Button>
          </form>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {departments.map((d) => (
              <li key={d.id} className="py-2.5 text-sm text-slate-700 dark:text-slate-200">{d.name}</li>
            ))}
            {departments.length === 0 && <p className="py-4 text-sm text-slate-400">No departments yet.</p>}
          </ul>
        </Card>

        <Card title="Designations">
          <form onSubmit={addDesignation} className="mb-4 flex gap-2">
            <Input placeholder="e.g. Product Designer" value={newDesig} onChange={(e) => setNewDesig(e.target.value)} className="flex-1" />
            <Button type="submit" loading={savingDesig}><Plus size={16} /> Add</Button>
          </form>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {designations.map((d) => (
              <li key={d.id} className="py-2.5 text-sm text-slate-700 dark:text-slate-200">{d.title}</li>
            ))}
            {designations.length === 0 && <p className="py-4 text-sm text-slate-400">No designations yet.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Departments;
