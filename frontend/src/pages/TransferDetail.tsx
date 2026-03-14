import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Transfer } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressSteps } from '@/components/ProgressSteps';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<Transfer | null>(null);

  useEffect(() => { if (id) api.getTransfer(+id).then(t => setTransfer(t || null)); }, [id]);

  const handleStatus = async (status: 'confirmed' | 'done' | 'cancelled') => {
    if (!transfer) return;
    await api.updateTransferStatus(transfer.id, status);
    setTransfer((await api.getTransfer(transfer.id)) || null);
  };

  if (!transfer) return <Layout><div className="p-6 text-muted-foreground font-mono">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl">
        <button onClick={() => navigate('/transfers')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-snappy">
          <ArrowLeft className="h-4 w-4" /> Back to Transfers
        </button>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-lg font-semibold font-mono">{transfer.reference}</h1>
            <p className="text-sm text-muted-foreground">Transfer — {transfer.scheduledDate}</p>
          </div>
          <StatusBadge status={transfer.status} />
        </div>
        <ProgressSteps current={transfer.status} />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-fade-in">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Transfer Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">From:</span> <span className="ml-2">{transfer.fromLocation}</span></div>
                <div><span className="text-muted-foreground">To:</span> <span className="ml-2">{transfer.toLocation}</span></div>
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
                  {transfer.lines.map(l => (
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
                <span>{transfer.fromLocation}</span>
                <span className="text-muted-foreground">→</span>
                <span>{transfer.toLocation}</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Actions</h2>
              {transfer.status === 'draft' && <Button className="w-full btn-press" onClick={() => handleStatus('confirmed')}>Confirm Transfer</Button>}
              {transfer.status === 'confirmed' && <Button className="w-full btn-press" onClick={() => handleStatus('done')}>Mark as Done</Button>}
              {transfer.status !== 'done' && transfer.status !== 'cancelled' && (
                <Button variant="outline" className="w-full btn-press border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatus('cancelled')}>Cancel</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
