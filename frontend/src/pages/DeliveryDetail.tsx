import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Delivery } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressSteps } from '@/components/ProgressSteps';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => { if (id) api.getDelivery(+id).then(d => setDelivery(d || null)); }, [id]);

  const handleStatus = async (status: 'confirmed' | 'done' | 'cancelled') => {
    if (!delivery) return;
    await api.updateDeliveryStatus(delivery.id, status);
    setDelivery((await api.getDelivery(delivery.id)) || null);
  };

  if (!delivery) return <Layout><div className="p-6 text-muted-foreground font-mono">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl">
        <button onClick={() => navigate('/deliveries')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-snappy">
          <ArrowLeft className="h-4 w-4" /> Back to Deliveries
        </button>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-lg font-semibold font-mono">{delivery.reference}</h1>
            <p className="text-sm text-muted-foreground">Delivery — {delivery.scheduledDate}</p>
          </div>
          <StatusBadge status={delivery.status} />
        </div>
        <ProgressSteps current={delivery.status} />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-fade-in">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Order Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> <span className="ml-2">{delivery.customer}</span></div>
                <div><span className="text-muted-foreground">Scheduled:</span> <span className="ml-2 font-mono">{delivery.scheduledDate}</span></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Product', 'UoM', 'Demand', 'Done'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {delivery.lines.map(l => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3">{l.productName}</td>
                      <td className="py-2 px-3 font-mono text-xs">{l.uom}</td>
                      <td className="py-2 px-3 font-mono text-xs">{l.demand.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono text-xs">{l.done.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Route</h2>
              <div className="flex items-center gap-2 text-sm">
                <span>Warehouse</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">Customer</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Actions</h2>
              {delivery.status === 'draft' && <Button className="w-full btn-press" onClick={() => handleStatus('confirmed')}>Confirm Delivery</Button>}
              {delivery.status === 'confirmed' && <Button className="w-full btn-press" onClick={() => handleStatus('done')}>Mark as Done</Button>}
              {delivery.status !== 'done' && delivery.status !== 'cancelled' && (
                <Button variant="outline" className="w-full btn-press border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatus('cancelled')}>Cancel</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
