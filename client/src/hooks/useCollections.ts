import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/axiosConfig';
import { Collection, CollectionCreateRequest, CollectionUpdateRequest } from '../types/api';

type SortKey = 'createdAt_desc' | 'lastActivity_desc' | 'name_asc';

export const useCollections = () => {
  const { t } = useTranslation();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce
  const debounceRef = useRef<number | null>(null);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/collections');
      setCollections(res.data?.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (payload: CollectionCreateRequest) => {
    const res = await api.post('/collections', payload);
    setCollections(prev => [...prev, res.data.data]);
    return res.data.data as Collection;
  };

  const updateCollection = async (id: string, payload: CollectionUpdateRequest) => {
    const res = await api.patch(`/collections/${id}`, payload);
    setCollections(prev => prev.map(c => (c._id === id ? res.data.data : c)));
    return res.data.data as Collection;
  };

  const deleteCollection = async (id: string) => {
    await api.delete(`/collections/${id}`);
    setCollections(prev => prev.filter(c => c._id !== id));
  };

  const updateCollectionSurveys = async (id: string, surveyIds: string[]) => {
    const res = await api.patch(`/collections/${id}/surveys`, { surveyIds });
    setCollections(prev => prev.map(c => (c._id === id ? res.data.data : c)));
    return res.data.data as Collection;
  };

  const duplicateCollection = async (id: string) => {
    let base = collections.find(c => c._id === id);
    if (!base) {
      const res = await api.get(`/collections/${id}`);
      base = (res.data?.data || res.data) as Collection;
    }
    if (!base) return null;
    const payload: CollectionCreateRequest = {
      name: `${base.name} - copy`,
      description: base.description,
      tags: base.tags,
      surveyIds: base.surveyIds,
    };
    const created = await createCollection(payload);
    return created;
  };

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const sb = (params.get('sort') || 'createdAt_desc') as SortKey;
    const p = parseInt(params.get('page') || '1', 10);
    const ps = parseInt(params.get('pageSize') || '10', 10);
    setQuery(q);
    setSortBy(sb);
    setPage(Number.isNaN(p) ? 1 : p);
    setPageSize(Number.isNaN(ps) ? 10 : ps);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query) params.set('q', query); else params.delete('q');
    params.set('sort', sortBy);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [query, sortBy, page, pageSize]);

  useEffect(() => {
    loadCollections();
  }, []);

  const setQueryDebounced = (value: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQuery(value);
      setPage(1);
    }, 300);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...collections];
    if (q) list = list.filter(c => [c.name, c.description].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
    switch (sortBy) {
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'lastActivity_desc':
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [collections, query, sortBy]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const items = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return {
    collections,
    loading,
    error,
    query,
    sortBy,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    setQuery: setQueryDebounced,
    setSortBy,
    setPage,
    setPageSize,
    items,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    updateCollectionSurveys,
    duplicateCollection,
  };
};
