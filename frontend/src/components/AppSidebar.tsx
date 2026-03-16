import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  History, ClipboardList, Building2, MapPin, User,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Products', url: '/products', icon: Package, badgeKey: 'products' as const },
  { title: 'Receipts', url: '/receipts', icon: ArrowDownToLine, badgeKey: 'receipts' as const },
  { title: 'Deliveries', url: '/deliveries', icon: ArrowUpFromLine },
  { title: 'Transfers', url: '/transfers', icon: ArrowLeftRight },
  { title: 'Move History', url: '/moves', icon: History },
  { title: 'Adjustments', url: '/adjustments', icon: ClipboardList },
];

const configItems = [
  { title: 'Warehouses', url: '/warehouses', icon: Building2 },
  { title: 'Locations', url: '/locations', icon: MapPin },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [badges, setBadges] = useState<{ products: number; receipts: number }>({ products: 0, receipts: 0 });

  useEffect(() => {
    Promise.all([api.getProducts(1, 100), api.getReceipts()]).then(([prods, recs]) => {
      const lowStock = prods.filter(p => p.onHand <= p.reorderPoint).length;
      const confirmedReceipts = recs.filter(r => r.status === 'confirmed').length;
      setBadges({ products: lowStock, receipts: confirmedReceipts });
    });
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderItem = (item: typeof mainItems[0]) => {
    const badge = 'badgeKey' in item && item.badgeKey ? badges[item.badgeKey] : 0;
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === '/dashboard'}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 relative group',
              isActive(item.url)
                ? 'bg-accent text-foreground'
                : 'text-sidebar-foreground hover:bg-accent/50 hover:text-foreground'
            )}
            activeClassName="bg-accent text-foreground"
          >
            {isActive(item.url) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full gradient-primary" />
            )}
            <item.icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive(item.url) && 'text-primary')} />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {badge > 0 && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full gradient-primary text-primary-foreground shadow-sm animate-pulse-badge">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <div className={cn('px-4 py-5 border-b border-border/50', collapsed && 'px-2')}>
        {collapsed ? (
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mx-auto shadow-sm glow-primary">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-sm glow-primary">
              <span className="text-primary-foreground font-bold text-sm">CI</span>
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground">CoreInventory</span>
              <p className="text-[10px] text-muted-foreground font-mono">v2.1.0</p>
            </div>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 font-semibold">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 font-semibold">Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{configItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <NavLink
              to="/profile"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200',
                isActive('/profile') ? 'bg-accent text-foreground' : 'text-sidebar-foreground hover:bg-accent/50'
              )}
              activeClassName="bg-accent text-foreground"
            >
              <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
              {!collapsed && <span>Profile</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
