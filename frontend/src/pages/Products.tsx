import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { StockBar } from '@/components/StockBar';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: 'Raw Material', uom: 'pcs', onHand: 0, reorderPoint: 10, reserved: 0, location: 'Main Store' });

  useEffect(() => { api.getProducts().then(setProducts); }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProduct(form);
    const updated = await api.getProducts();
    setProducts(updated);
    setOpen(false);
    setForm({ name: '', sku: '', category: 'Raw Material', uom: 'pcs', onHand: 0, reorderPoint: 10, reserved: 0, location: 'Main Store' });
  };

  const freeToUse = (p: Product) => p.onHand - p.reserved;
  const freeColor = (p: Product) => {
    const free = freeToUse(p);
    if (free <= 0) return 'text-stock-critical';
    if (free <= p.reorderPoint * 0.2 + p.reorderPoint) return 'text-stock-warning';
    return 'text-stock-healthy';
  };

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Products</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-press gap-1.5"><Plus className="h-3.5 w-3.5" />New Product</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-surface border-border" /></div>
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} required className="bg-surface border-border font-mono" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="bg-surface border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['Raw Material', 'Hardware', 'Components', 'Finished Goods'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">UoM</Label>
                    <Select value={form.uom} onValueChange={v => setForm(f => ({ ...f, uom: v }))}>
                      <SelectTrigger className="bg-surface border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['kg', 'pcs', 'rolls', 'meters', 'liters'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Initial Stock</Label><Input type="number" value={form.onHand} onChange={e => setForm(f => ({ ...f, onHand: +e.target.value }))} className="bg-surface border-border font-mono" /></div>
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Reorder Point</Label><Input type="number" value={form.reorderPoint} onChange={e => setForm(f => ({ ...f, reorderPoint: +e.target.value }))} className="bg-surface border-border font-mono" /></div>
                </div>
                <Button type="submit" className="w-full btn-press">Create Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or SKU..." />

        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Product', 'SKU', 'Category', 'UoM', 'On Hand', 'Reserved', 'Free to Use', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 row-hover">
                  <td className="py-2 px-3">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.location}</div>
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">{p.sku}</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{p.category}</td>
                  <td className="py-2 px-3 text-xs font-mono">{p.uom}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{p.onHand.toFixed(2)}</span>
                      <StockBar onHand={p.onHand} reorderPoint={p.reorderPoint} />
                    </div>
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">{p.reserved.toFixed(2)}</td>
                  <td className={cn('py-2 px-3 font-mono text-xs font-semibold', freeColor(p))}>{freeToUse(p).toFixed(2)}</td>
                  <td className="py-2 px-3">
                    {p.onHand === 0 ? <StatusBadge status="cancelled" /> : p.onHand <= p.reorderPoint ? <StatusBadge status="confirmed" /> : <StatusBadge status="done" />}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm font-mono">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
