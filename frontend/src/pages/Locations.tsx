import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Location as Loc } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { cn } from '@/lib/utils';

const typeColors: Record<string, string> = {
  storage: 'bg-status-done/20 text-status-done border-status-done/30',
  production: 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30',
  staging: 'bg-muted text-muted-foreground border-border',
  shipping: 'bg-stock-healthy/20 text-stock-healthy border-stock-healthy/30',
};

export default function Locations() {
  const [locations, setLocations] = useState<Loc[]>([]);

  useEffect(() => { api.getLocations().then(setLocations); }, []);

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <h1 className="text-lg font-semibold">Locations</h1>
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Code', 'Warehouse', 'Type'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 row-hover">
                  <td className="py-2 px-3 text-sm">{l.name}</td>
                  <td className="py-2 px-3 font-mono text-xs">{l.code}</td>
                  <td className="py-2 px-3 text-sm text-muted-foreground">{l.warehouse}</td>
                  <td className="py-2 px-3">
                    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wider', typeColors[l.type])}>
                      {l.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
