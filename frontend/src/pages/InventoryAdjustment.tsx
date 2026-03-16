import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function InventoryAdjustment() {
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.getProducts(1, 200).then(prods => {
      setProducts(prods);
      const initial: Record<number, number> = {};
      prods.forEach(p => { initial[p.id] = p.onHand; });
      setCounts(initial);
    });
  }, []);

  const changedCount = products.filter(p => counts[p.id] !== p.onHand).length;

  const handleApply = async () => {
    setApplying(true);
    const adjustments = products.filter(p => counts[p.id] !== p.onHand).map(p => ({ productId: p.id, newQty: counts[p.id] }));
    await api.applyAdjustments(adjustments);
    const updated = await api.getProducts();
    setProducts(updated);
    setApplying(false);
  };

  return (
    <Layout>
      <div className="p-6 space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Inventory Adjustment</h1>
          <Button onClick={handleApply} disabled={changedCount === 0 || applying} className="btn-press">
            {applying ? 'Applying...' : 'Apply Adjustments'}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Product', 'SKU', 'Current On Hand', 'Counted Qty', 'Delta'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const delta = (counts[p.id] ?? p.onHand) - p.onHand;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 row-hover">
                    <td className="py-2 px-3 text-sm">{p.name}</td>
                    <td className="py-2 px-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-2 px-3 font-mono text-xs">{p.onHand.toFixed(2)}</td>
                    <td className="py-1 px-3">
                      <input
                        type="number"
                        value={counts[p.id] ?? p.onHand}
                        onChange={e => setCounts(c => ({ ...c, [p.id]: +e.target.value }))}
                        className="w-24 h-8 px-2 text-sm font-mono bg-surface border border-border rounded-lg text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200"
                      />
                    </td>
                    <td className={cn('py-2 px-3 font-mono text-xs font-semibold', delta > 0 ? 'text-stock-healthy' : delta < 0 ? 'text-stock-critical' : 'text-muted-foreground')}>
                      {delta !== 0 ? (delta > 0 ? `+${delta}` : delta) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg">
          <span className="text-xs text-muted-foreground">All changes logged in Move History.</span>
          <span className="text-xs font-mono"><span className="text-muted-foreground">Lines changed:</span> <span className="text-foreground font-semibold">{changedCount}</span></span>
        </div>
      </div>
    </Layout>
  );
}
