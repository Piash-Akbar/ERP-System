import { useState, useEffect, useCallback } from 'react';

const useFetch = (fetchFn, options = {}) => {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    search: '',
    ...options.initialParams,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn(params);
      setData(res.data.data?.data || res.data.data || []);
      setPagination(res.data.data?.pagination || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPage = (page) => setParams((p) => ({ ...p, page }));
  const setSearch = (search) => setParams((p) => ({ ...p, search, page: 1 }));
  const refetch = () => fetchData();

  return { data, pagination, loading, error, setPage, setSearch, setParams, refetch };
};

export default useFetch;
