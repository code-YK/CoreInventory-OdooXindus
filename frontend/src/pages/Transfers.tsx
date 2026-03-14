import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Transfer, Location as Loc } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Info } from 'lucide-react';

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: '', to: '', product: '', qty: 0, uom: 'pcs', date: '' });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getTransfers(), api.getLocations()]).then(([t, l]) => { setTransfers(t); setLocations(l); });
  }, []);

  const filtered = transfers.filter(t => {
    const q = search.toLowerCase();
    return t.reference.toLowerCase().includes(q) || t.fromLocation.toLowerCase().includes(q) || t.toLocation.toLowerCase().includes(q);
  });

  const handleStatus = async (id: number, status: 'confirmed' | 'done') => {
    await api.updateTransferStatus(id, status);
    setTransfers(await api.getTransfers());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTransfer({
      fromLocation: form.from,
      toLocation: form.to,
      scheduledDate: form.date,
      lines: [{ productId: 1, productName: form.product, demand: form.qty, done: 0, uom: form.uom }],
    });
    setTransfers(await api.getTransfers());
    setOpen(false);
  };

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Transfers</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-press gap-1.5"><Plus className="h-3.5 w-3.5" />New Transfer</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>New Transfer</DialogTitle></DialogHeader>
              <div className="flex items-start gap-2 px-3 py-2 bg-status-done/10 border border-status-done/20 rounded-lg text-xs text-status-done mb-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Moves stock between locations — total inventory unchanged.
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Source</Label>
                    <Select value={form.from} onValueChange={v => setForm(f => ({ ...f, from: v }))}>
                      <SelectTrigger className="bg-surface border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {locations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destination</Label>
                    <Select value={form.to} onValueChange={v => setForm(f => ({ ...f, to: v }))}>
                      <SelectTrigger className="bg-surface border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {locations.filter(l => l.name !== form.from).map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Product</Label><Input value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} required className="bg-surface border-border" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Qty</Label><Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: +e.target.value }))} className="bg-surface border-border font-mono" /></div>
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Unit</Label><Input value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))} className="bg-surface border-border font-mono" /></div>
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-surface border-border font-mono" /></div>
                </div>
                <Button type="submit" className="w-full btn-press">Create Transfer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search by reference or location..." />

        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Reference', 'From', 'To', 'Scheduled', 'Lines', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 row-hover cursor-pointer" onClick={() => navigate(`/transfers/${t.id}`)}>
                  <td className="py-2 px-3 font-mono text-xs">{t.reference}</td>
                  <td className="py-2 px-3 text-sm">{t.fromLocation}</td>
                  <td className="py-2 px-3 text-sm">{t.toLocation}</td>
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{t.scheduledDate}</td>
                  <td className="py-2 px-3 font-mono text-xs">{t.lines.length}</td>
                  <td className="py-2 px-3"><StatusBadge status={t.status} /></td>
                  <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                    {t.status === 'draft' && <Button size="sm" variant="outline" className="h-7 text-xs btn-press" onClick={() => handleStatus(t.id, 'confirmed')}>Confirm</Button>}
                    {t.status === 'confirmed' && <Button size="sm" variant="outline" className="h-7 text-xs btn-press" onClick={() => handleStatus(t.id, 'done')}>Done</Button>}
                  </td>
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
