'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Package,
  Heart,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  ShoppingBag,
  Star,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',  icon: Clock },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-blue-600   bg-blue-50   border-blue-200',    icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', color: 'text-indigo-600 bg-indigo-50 border-indigo-200',  icon: Package },
  SHIPPED:    { label: 'Shipped',    color: 'text-purple-600 bg-purple-50 border-purple-200',  icon: Truck },
  DELIVERED:  { label: 'Delivered',  color: 'text-green-600  bg-green-50  border-green-200',   icon: CheckCircle2 },
  CANCELLED:  { label: 'Cancelled',  color: 'text-red-600    bg-red-50    border-red-200',     icon: XCircle },
  RETURNED:   { label: 'Returned',   color: 'text-gray-600   bg-gray-50   border-gray-200',    icon: XCircle },
};

const statCards = [
  { label: 'Total Orders',   key: 'total',     icon: ShoppingBag, gradient: 'from-blue-500 to-blue-600',    bg: 'bg-blue-50',   text: 'text-blue-600' },
  { label: 'Active Orders',  key: 'active',    icon: Truck,       gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-600' },
  { label: 'Delivered',      key: 'delivered', icon: CheckCircle2,gradient: 'from-green-500 to-green-600',   bg: 'bg-green-50',  text: 'text-green-600' },
  { label: 'Cancelled',      key: 'cancelled', icon: XCircle,     gradient: 'from-red-500 to-red-600',       bg: 'bg-red-50',    text: 'text-red-600' },
];

const quickLinks = [
  { href: '/account/orders',       icon: Package,      label: 'My Orders',       desc: 'Track & manage orders' },
  { href: '/account/profile',      icon: Star,         label: 'Edit Profile',    desc: 'Update your info' },
  { href: '/account/addresses',    icon: MapPin,       label: 'Addresses',       desc: 'Saved delivery spots' },
  { href: '/wishlist',             icon: Heart,        label: 'Wishlist',        desc: 'Your saved items' },
];

export default function AccountOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      try {
        const res = await fetch('/api/account/orders?limit=5', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);

          const allRes = await fetch('/api/account/orders?limit=200', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const allData = await allRes.json();
          const all: OrderSummary[] = allData.orders || [];
          setStats({
            total: all.length,
            active: all.filter(o => ['PENDING','CONFIRMED','PROCESSING','SHIPPED'].includes(o.status)).length,
            delivered: all.filter(o => o.status === 'DELIVERED').length,
            cancelled: all.filter(o => o.status === 'CANCELLED').length,
          });
        }
      } catch (_) {
        // API not available; stats stay 0
      }
      setLoading(false);
    };
    init();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden shadow-lg"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 border-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}>
            {initials}
          </div>
          <div>
            <p className="text-blue-100 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {memberSince && <p className="text-blue-200 text-xs mt-1">Member since {memberSince}</p>}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${card.text}`} />
              </div>
              {loading ? (
                <div className="h-7 w-10 bg-gray-100 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{stats[card.key as keyof typeof stats]}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group text-center"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">{link.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{link.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here.</p>
            <Link href="/" className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              Browse Products <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.PENDING;
              const StatusIcon = cfg.icon;
              const firstItem = order.items[0];
              return (
                <Link
                  key={order.id}
                  href={`/account/orders?id=${order.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{order.orderNumber}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    {firstItem && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {firstItem.productName}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">৳{order.grandTotal.toLocaleString()}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 mt-1 ml-auto transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
