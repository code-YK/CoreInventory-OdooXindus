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

  useEffect(() => { api.getMoveHistory().then(setMoves); }, []);

  const filtered = moves.filter(m => {
    const q = search.toLowerCase();
    return m.reference.toLowerCase().includes(q) || m.product.toLowerCase().includes(q);
  });

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <h1 className="text-lg font-semibold">Move History</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by reference or product..." />
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
