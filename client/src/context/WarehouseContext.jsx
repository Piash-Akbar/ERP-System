import { createContext, useContext, useState, useEffect } from 'react';
import { getWarehouses } from '../services/location.service';

const WarehouseContext = createContext(null);

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error('useWarehouse must be used within WarehouseProvider');
  return context;
};

export const WarehouseProvider = ({ children }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('selectedWarehouse');
    if (saved) {
      try {
        setSelectedWarehouse(JSON.parse(saved));
      } catch {}
    }
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const { data } = await getWarehouses();
      const list = data.data?.data || data.data || [];
      setWarehouses(list);

      // Auto-select first warehouse if none selected
      const saved = localStorage.getItem('selectedWarehouse');
      if (!saved && list.length > 0) {
        selectWarehouse(list[0]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const selectWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    localStorage.setItem('selectedWarehouse', JSON.stringify(warehouse));
  };

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        selectWarehouse,
        loading,
        refreshWarehouses: loadWarehouses,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};
