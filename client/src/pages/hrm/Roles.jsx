import { useState } from 'react';
import { HiOutlineShieldCheck, HiOutlineChartBarSquare, HiOutlineCalculator } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';

const roles = [
  { name: 'Administrator', desc: 'Full system access', permissions: 42, icon: HiOutlineShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Sales Manager', desc: 'Manage sales operations', permissions: 18, icon: HiOutlineChartBarSquare, color: 'text-green-600', bg: 'bg-green-50' },
  { name: 'Accountant', desc: 'Manage financial records', permissions: 15, icon: HiOutlineCalculator, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const Roles = () => {
  return (
    <div>
      <PageHeader title="Role Management" subtitle="Manage user roles and permissions">
        <button className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Role</button>
      </PageHeader>

      <div className="mb-4"><input type="text" placeholder="Search roles..." className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.name} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className={`w-10 h-10 ${r.bg} rounded-lg flex items-center justify-center mb-4`}>
              <r.icon className={`w-5 h-5 ${r.color}`} />
            </div>
            <h3 className="text-base font-semibold text-gray-900">{r.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
            <p className="text-xs text-gray-400 mt-2">Permissions: {r.permissions}</p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roles;
