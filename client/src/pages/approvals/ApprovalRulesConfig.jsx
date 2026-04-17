import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getApprovalRules, createApprovalRule, updateApprovalRule, deleteApprovalRule } from '../../services/approval.service';

const emptyLevel = { level: 1, approverRoles: [], approverUsers: [], requiredCount: 1, escalateAfterHours: 48 };

const initialForm = {
  name: '',
  module: '',
  action: '',
  conditions: [],
  levels: [{ ...emptyLevel }],
  isActive: true,
  priority: 0,
};

const ApprovalRulesConfig = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { data, pagination, loading: fetchLoading, setPage, setSearch, refetch } = useFetch(getApprovalRules);

  const isEdit = Boolean(editingRule);

  useEffect(() => {
    if (editingRule) {
      setForm({
        name: editingRule.name || '',
        module: editingRule.module || '',
        action: editingRule.action || '',
        conditions: editingRule.conditions || [],
        levels: editingRule.levels?.length
          ? editingRule.levels.map((l) => ({
              level: l.level,
              approverRoles: l.approverRoles?.map((r) => r._id || r) || [],
              approverUsers: l.approverUsers?.map((u) => u._id || u) || [],
              requiredCount: l.requiredCount || 1,
              escalateAfterHours: l.escalateAfterHours || 48,
            }))
          : [{ ...emptyLevel }],
        isActive: editingRule.isActive !== undefined ? editingRule.isActive : true,
        priority: editingRule.priority || 0,
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [editingRule, modalOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLevelChange = (idx, field, value) => {
    setForm((prev) => {
      const levels = [...prev.levels];
      levels[idx] = { ...levels[idx], [field]: value };
      return { ...prev, levels };
    });
  };

  const addLevel = () => {
    setForm((prev) => ({
      ...prev,
      levels: [...prev.levels, { ...emptyLevel, level: prev.levels.length + 1 }],
    }));
  };

  const removeLevel = (idx) => {
    if (form.levels.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 })),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.module.trim()) newErrors.module = 'Module is required';
    if (!form.action.trim()) newErrors.action = 'Action is required';
    if (form.levels.length === 0) newErrors.levels = 'At least one level required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        priority: Number(form.priority) || 0,
      };
      if (isEdit) {
        await updateApprovalRule(editingRule._id, payload);
        toast.success('Rule updated');
      } else {
        await createApprovalRule(payload);
        toast.success('Rule created');
      }
      refetch();
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await deleteApprovalRule(rule._id);
      toast.success('Rule deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', label: 'Rule Name' },
    { key: 'module', label: 'Module', render: (row) => <span className="capitalize">{row.module}</span> },
    { key: 'action', label: 'Action', render: (row) => <span className="capitalize">{row.action}</span> },
    {
      key: 'levels',
      label: 'Levels',
      render: (row) => row.levels?.length || 0,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    { key: 'priority', label: 'Priority' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditingRule(row); setModalOpen(true); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Approval Rules" subtitle="Configure approval workflows">
        <button
          onClick={() => { setEditingRule(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Rule
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={fetchLoading}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEdit ? 'Edit Rule' : 'Add Rule'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Rule Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Purchase Over 50K" />
            <FormInput label="Module" name="module" value={form.module} onChange={handleChange} error={errors.module} placeholder="e.g. purchase" />
            <FormInput label="Action" name="action" value={form.action} onChange={handleChange} error={errors.action} placeholder="e.g. create" />
            <FormInput label="Priority" type="number" name="priority" value={form.priority} onChange={handleChange} placeholder="0" min="0" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Approval Levels</label>
              <button type="button" onClick={addLevel} className="text-sm text-blue-600 hover:underline">
                + Add Level
              </button>
            </div>
            {form.levels.map((level, idx) => (
              <div key={idx} className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-500 w-16">Level {level.level}</span>
                <input
                  type="number"
                  value={level.requiredCount}
                  onChange={(e) => handleLevelChange(idx, 'requiredCount', Number(e.target.value))}
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="Required"
                  min="1"
                />
                <span className="text-xs text-gray-400">approvals needed</span>
                <input
                  type="number"
                  value={level.escalateAfterHours}
                  onChange={(e) => handleLevelChange(idx, 'escalateAfterHours', Number(e.target.value))}
                  className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="Hours"
                  min="1"
                />
                <span className="text-xs text-gray-400">hrs to escalate</span>
                {form.levels.length > 1 && (
                  <button type="button" onClick={() => removeLevel(idx)} className="text-red-500 hover:text-red-700 text-sm ml-auto">
                    Remove
                  </button>
                )}
              </div>
            ))}
            {errors.levels && <p className="text-sm text-red-500">{errors.levels}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ruleActive"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="ruleActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApprovalRulesConfig;
