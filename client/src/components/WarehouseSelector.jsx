import { useState, useRef, useEffect } from 'react';
import { HiOutlineBuildingStorefront, HiOutlineChevronDown } from 'react-icons/hi2';
import { useWarehouse } from '../context/WarehouseContext';

const WarehouseSelector = () => {
  const { warehouses, selectedWarehouse, selectWarehouse } = useWarehouse();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!warehouses.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <HiOutlineBuildingStorefront className="w-4 h-4 text-blue-500" />
        <span className="max-w-[160px] truncate">
          {selectedWarehouse?.name || 'Select Warehouse'}
        </span>
        <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1 max-h-60 overflow-y-auto">
          {warehouses.map((wh) => (
            <button
              key={wh._id}
              onClick={() => {
                selectWarehouse(wh);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedWarehouse?._id === wh._id
                  ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium">{wh.name}</div>
              {wh.code && <div className="text-xs text-gray-400">{wh.code}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehouseSelector;
