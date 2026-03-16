import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { MoveRecord } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { TypeBadge } from '@/components/TypeBadge';
import { SearchBar } from '@/components/SearchBar';
import { cn } from '@/lib/utils';

export default function MoveHistory() {
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  const loadHistory = async (pageToLoad = 1) => {
    const rows = await api.getMoveHistory(pageToLoad, 20);
    setMoves(rows);
    setIsLastPage(rows.length < 20);
    setPage(pageToLoad);
  };

  useEffect(() => { loadHistory(1); }, []);

  const filtered = moves.filter(m => {
    const q = search.toLowerCase();
    return m.reference.toLowerCase().includes(q) || m.product.toLowerCase().includes(q);
  });

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <h1 className="text-lg font-semibold">Move History</h1>
        <div className="flex flex-wrap md:flex-row md:items-center md:justify-between gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by reference or product..." />
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => loadHistory(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost btn-xs px-2 py-1 rounded-md border border-border disabled:opacity-40">← Prev</button>
            <span className="text-muted-foreground">Page {page}</span>
            <button onClick={() => !isLastPage && loadHistory(page + 1)} disabled={isLastPage} className="btn-ghost btn-xs px-2 py-1 rounded-md border border-border disabled:opacity-40">Next →</button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Reference', 'Product', 'From', 'To', 'Qty', 'Type'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-border last:border-0 row-hover">
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-2 px-3 font-mono text-xs">{m.reference}</td>
                  <td className="py-2 px-3 text-sm">{m.product}</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{m.from}</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{m.to}</td>
                  <td className={cn('py-2 px-3 font-mono text-xs font-semibold', m.qty >= 0 ? 'text-stock-healthy' : 'text-stock-critical')}>
                    {m.qty >= 0 ? `+${m.qty}` : m.qty}
                  </td>
                  <td className="py-2 px-3"><TypeBadge type={m.type} /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm font-mono">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
