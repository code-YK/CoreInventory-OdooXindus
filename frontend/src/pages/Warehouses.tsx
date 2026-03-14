import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Warehouse } from '@/lib/types';
import { Layout } from '@/components/Layout';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => { api.getWarehouses().then(setWarehouses); }, []);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your storage facilities</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w, idx) => (
            <div
              key={w.id}
              className="relative gradient-card border-glow rounded-xl p-5 space-y-4 surface-glow animate-fade-in group cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
            >
              {/* Decorative */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors duration-300" />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <h3 className="font-bold text-sm">{w.name}</h3>
                  <span className="font-mono text-xs text-muted-foreground">{w.code}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground relative z-10">{w.address}</p>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="font-mono font-semibold text-foreground">{w.locationCount}</span> locations
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-200 translate-x-0 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
