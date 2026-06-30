import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersService } from '../../services/dataService';
import { Order, TableFilters } from '../../types';
import { StatusBadge, SearchInput, Pagination, TableSkeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { format } from 'date-fns';

const ORDER_STATUSES = ['Requested', 'Confirmed', 'In Progress', 'Packed Up', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TableFilters>({ page: 1, limit: 8 });
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [updateOrder, setUpdateOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersService.getAll(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order deleted'); setDeleteOrder(null); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersService.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order status updated'); setUpdateOrder(null); },
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{data?.total ?? 0} total orders</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={filters.search || ''}
            onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
            placeholder="Search orders..."
          />
          <select
            className="input-field py-2"
            style={{ width: 160 }}
            value={filters.status || ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All Status</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                {['Order ID', 'Customer', 'Amount', 'Payment', 'Order Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-6"><TableSkeleton rows={6} cols={7} /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={7}><EmptyState icon="📦" title="No orders found" /></td></tr>
              ) : (
                data.data.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: 'var(--accent)' }}>{order.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.customerName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>₹{order.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.orderStatus} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(order.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-sm btn-icon" title="View" onClick={() => navigate(`/orders/${order.id}`)}>👁️</button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Update Status" onClick={() => { setUpdateOrder(order); setNewStatus(order.orderStatus); }}>✏️</button>
                        <button className="btn btn-ghost btn-sm btn-icon text-red-500" title="Delete" onClick={() => setDeleteOrder(order)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, data.total)} of {data.total}
            </p>
            <Pagination page={filters.page} totalPages={data.totalPages} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {updateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setUpdateOrder(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Update Order Status</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Order: <strong>{updateOrder.id}</strong></p>
            <select className="input-field mb-4" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setUpdateOrder(null)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={() => statusMutation.mutate({ id: updateOrder.id, status: newStatus })}>Update</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteOrder}
        title="Delete Order"
        message={`Delete order ${deleteOrder?.id}?`}
        confirmLabel="Delete"
        onConfirm={() => deleteOrder && deleteMutation.mutate(deleteOrder.id)}
        onCancel={() => setDeleteOrder(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
