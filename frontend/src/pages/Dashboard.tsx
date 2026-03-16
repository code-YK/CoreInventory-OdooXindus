import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Receipt, Delivery, Transfer } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { SearchBar } from '@/components/SearchBar';
import { cn } from '@/lib/utils';
import { AlertTriangle, Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Building2, TrendingUp, TrendingDown } from 'lucide-react';

type FilterType = 'all' | 'receipt' | 'delivery' | 'transfer';
type FilterStatus = 'all' | 'draft' | 'confirmed' | 'done';

type KpiData = {
  total_products: number;
  low_stock_count: number;
  pending_receipts: number;
  pending_deliveries: number;
  pending_transfers: number;
};

export default function Dashboard() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    Promise.all([
      api.getReceipts(),
      api.getDeliveries(),
      api.getTransfers(),
      api.getDashboardKpis(),
    ]).then(([r, d, t, kpis]) => {
      setReceipts(r); setDeliveries(d); setTransfers(t); setKpiData(kpis);
    });
  }, []);

  const kpis = kpiData ? [
    { label: 'Total Products', value: kpiData.total_products.toLocaleString(), icon: Package, alert: false, trend: 'in catalog', trendUp: true },
    { label: 'Low / Out of Stock', value: `${kpiData.low_stock_count}`, icon: AlertTriangle, alert: kpiData.low_stock_count > 0, trend: 'needs review', trendUp: false },
    { label: 'Pending Receipts', value: kpiData.pending_receipts.toString(), icon: ArrowDownToLine, alert: false, trend: 'inbound', trendUp: true },
    { label: 'Pending Deliveries', value: kpiData.pending_deliveries.toString(), icon: ArrowUpFromLine, alert: false, trend: 'outbound', trendUp: true },
    { label: 'Pending Transfers', value: kpiData.pending_transfers.toString(), icon: ArrowLeftRight, alert: false, trend: 'internal moves', trendUp: true },
  ] : [
    { label: 'Total Products', value: '—', icon: Package, alert: false, trend: 'loading…', trendUp: true },
    { label: 'Low / Out of Stock', value: '—', icon: AlertTriangle, alert: false, trend: 'loading…', trendUp: false },
    { label: 'Pending Receipts', value: '—', icon: ArrowDownToLine, alert: false, trend: 'loading…', trendUp: true },
    { label: 'Pending Deliveries', value: '—', icon: ArrowUpFromLine, alert: false, trend: 'loading…', trendUp: true },
    { label: 'Pending Transfers', value: '—', icon: Building2, alert: false, trend: 'loading…', trendUp: true },
  ];


  type OpRow = { type: 'receipt' | 'delivery' | 'transfer'; reference: string; partner: string; date: string; status: 'draft' | 'confirmed' | 'done' | 'cancelled'; lines: number };
  const operations: OpRow[] = [
    ...receipts.map(r => ({ type: 'receipt' as const, reference: r.reference, partner: r.supplier, date: r.scheduledDate, status: r.status, lines: r.lines.length })),
    ...deliveries.map(d => ({ type: 'delivery' as const, reference: d.reference, partner: d.customer, date: d.scheduledDate, status: d.status, lines: d.lines.length })),
    ...transfers.map(t => ({ type: 'transfer' as const, reference: t.reference, partner: `${t.fromLocation} → ${t.toLocation}`, date: t.scheduledDate, status: t.status, lines: t.lines.length })),
  ].filter(op => {
    if (typeFilter !== 'all' && op.type !== typeFilter) return false;
    if (statusFilter !== 'all' && op.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return op.reference.toLowerCase().includes(q) || op.partner.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Inventory overview & operations</p>
          </div>
          <div className="text-xs font-mono text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5 surface-glow">
            Last synced: just now
          </div>
        </div>

        {/* Alert Banner */}
        {(kpiData?.low_stock_count ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in border border-primary/30 glow-primary" style={{ background: 'linear-gradient(135deg, hsl(0 68% 60% / 0.12), hsl(0 68% 60% / 0.04))' }}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium"><span className="font-mono font-bold text-primary">{kpiData?.low_stock_count}</span> product(s) low or out of stock</span>
              <p className="text-xs text-muted-foreground mt-0.5">Review inventory immediately to prevent supply chain disruptions.</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4">
          {kpis.map((kpi, idx) => (
            <div
              key={kpi.label}
              className={cn(
                'relative h-[110px] gradient-card rounded-xl p-4 flex flex-col justify-between surface-glow animate-fade-in group cursor-default overflow-hidden',
                'hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300',
                kpi.alert ? 'border border-primary/40 glow-primary' : 'border-glow'
              )}
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
            >
              {/* Decorative background circle */}
              <div className={cn('absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]', kpi.alert ? 'bg-primary' : 'bg-foreground')} />
              
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{kpi.label}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', kpi.alert ? 'bg-primary/20' : 'bg-accent')}>
                  <kpi.icon className={cn('h-3.5 w-3.5', kpi.alert ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors')} />
                </div>
              </div>
              <div className="relative z-10">
                <span className={cn('text-2xl font-mono font-bold', kpi.alert ? 'text-primary' : 'text-foreground')}>{kpi.value}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {kpi.trendUp ? <TrendingUp className="h-3 w-3 text-stock-healthy" /> : <TrendingDown className="h-3 w-3 text-stock-warning" />}
                  <span className={cn('text-[10px] font-mono', kpi.trendUp ? 'text-stock-healthy' : 'text-stock-warning')}>{kpi.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Operations Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Operations</h2>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search reference or partner..." />
            <div className="flex gap-1 bg-card border-glow rounded-lg p-1">
              {(['all', 'receipt', 'delivery', 'transfer'] as FilterType[]).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-3 py-1.5 text-xs rounded-lg font-mono uppercase tracking-wider transition-all duration-200 btn-press', typeFilter === t ? 'gradient-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-card border-glow rounded-lg p-1">
              {(['all', 'draft', 'confirmed', 'done'] as FilterStatus[]).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-3 py-1.5 text-xs rounded-lg font-mono uppercase tracking-wider transition-all duration-200 btn-press', statusFilter === s ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-card border-glow rounded-xl overflow-hidden surface-glow animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Reference</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Partner / Route</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Lines</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0 row-hover group/row" style={{ animationDelay: `${400 + i * 50}ms` }}>
                    <td className="py-3 px-4"><TypeBadge type={op.type} /></td>
                    <td className="py-3 px-4 font-mono text-xs group-hover/row:text-primary transition-colors">{op.reference}</td>
                    <td className="py-3 px-4 text-sm">{op.partner}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{op.date}</td>
                    <td className="py-3 px-4 font-mono text-xs">{op.lines}</td>
                    <td className="py-3 px-4"><StatusBadge status={op.status} /></td>
                  </tr>
                ))}
                {operations.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm font-mono">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
