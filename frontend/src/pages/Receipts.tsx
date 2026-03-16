import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Receipt } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';

export default function Receipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const navigate = useNavigate();

  const loadReceipts = async (pageToLoad = 1) => {
    const rows = await api.getReceipts(pageToLoad, 20);
    setReceipts(rows);
    setIsLastPage(rows.length < 20);
    setPage(pageToLoad);
  };

  useEffect(() => { loadReceipts(1); }, []);

  const filtered = receipts.filter(r => {
    const q = search.toLowerCase();
    return r.reference.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q);
  });

  const handleStatus = async (id: number, status: 'confirmed' | 'done') => {
    await api.updateReceiptStatus(id, status);
    setReceipts(await api.getReceipts());
  };

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <h1 className="text-lg font-semibold">Receipts</h1>
        <div className="flex flex-wrap md:flex-row md:items-center md:justify-between gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by reference or supplier..." />
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => loadReceipts(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost btn-xs px-2 py-1 rounded-md border border-border disabled:opacity-40">← Prev</button>
            <span className="text-muted-foreground">Page {page}</span>
            <button onClick={() => !isLastPage && loadReceipts(page + 1)} disabled={isLastPage} className="btn-ghost btn-xs px-2 py-1 rounded-md border border-border disabled:opacity-40">Next →</button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Reference', 'Supplier', 'Scheduled', 'Lines', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 row-hover cursor-pointer" onClick={() => navigate(`/receipts/${r.id}`)}>
                  <td className="py-2 px-3 font-mono text-xs">{r.reference}</td>
                  <td className="py-2 px-3 text-sm">{r.supplier}</td>
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{r.scheduledDate}</td>
                  <td className="py-2 px-3 font-mono text-xs">{r.lines.length}</td>
                  <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    {r.status === 'draft' && <Button size="sm" variant="outline" className="h-7 text-xs btn-press" onClick={() => handleStatus(r.id, 'confirmed')}>Confirm</Button>}
                    {r.status === 'confirmed' && <Button size="sm" variant="outline" className="h-7 text-xs btn-press" onClick={() => handleStatus(r.id, 'done')}>Done</Button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm font-mono">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
