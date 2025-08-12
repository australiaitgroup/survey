import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../utils/axiosConfig';

interface Props {
  surveyId: string;
  companySlug: string;
}

const PAGE_SIZE = 10;

const SurveyInvitationsTab: React.FC<Props> = ({ surveyId, companySlug }) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invitations/survey/${surveyId}`);
      setInvitations(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [surveyId]);

  const filtered = useMemo(() => {
    return invitations.filter(inv => !search || (inv.targetEmails && inv.targetEmails.some((e: string) => e.includes(search))));
  }, [invitations, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatus = (inv: any) => {
    const now = new Date();
    if (inv.completedBy && inv.completedBy.length > 0) return { label: 'Completed', color: 'green' as const };
    if (inv.expiresAt && new Date(inv.expiresAt) < now) return { label: 'Expired', color: 'red' as const };
    return { label: 'Not filled', color: 'gray' as const };
  };

  const maskToken = (token: string) => (token ? token.slice(0, 6) + '****' + token.slice(-4) : '');

  const handleCopy = (token: string) => {
    const basePath = companySlug ? `/${companySlug}` : '';
    const url = `${window.location.origin}${basePath}/assessment/${token}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className='mt-4'>
      <div className='flex justify-between items-center mb-2'>
        <div className='font-medium text-gray-800'>Invited Users List</div>
        <input className='border rounded px-2 py-1 text-sm' placeholder='Search Email' value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 180 }} />
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm border'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='px-2 py-1 border'>Email</th>
              <th className='px-2 py-1 border'>Token</th>
              <th className='px-2 py-1 border'>Invitation Time</th>
              <th className='px-2 py-1 border'>Valid Until</th>
              <th className='px-2 py-1 border'>Status</th>
              <th className='px-2 py-1 border'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className='text-center py-4'>Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={6} className='text-center py-4'>No invitations</td></tr>
            ) : (
              paged.map(inv => {
                const status = getStatus(inv);
                return (
                  <tr key={inv._id}>
                    <td className='px-2 py-1 border'>{inv.targetEmails?.[0]}</td>
                    <td className='px-2 py-1 border font-mono'>{maskToken(inv.invitationCode)}</td>
                    <td className='px-2 py-1 border'>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}</td>
                    <td className='px-2 py-1 border'>{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'Permanent'}</td>
                    <td className='px-2 py-1 border'>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${status.color === 'green' ? 'bg-green-100 text-green-700' : status.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{status.label}</span>
                    </td>
                    <td className='px-2 py-1 border space-x-2'>
                      <button className='text-blue-600 hover:underline' onClick={() => handleCopy(inv.invitationCode)}>Copy Link</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className='flex justify-center items-center gap-2 mt-2'>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className='px-2 py-1 border rounded disabled:opacity-50'>Previous</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className='px-2 py-1 border rounded disabled:opacity-50'>Next</button>
        </div>
      )}
    </div>
  );
};

export default SurveyInvitationsTab;
