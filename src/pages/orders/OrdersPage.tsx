import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersService } from '../../services/dataService';
import { Order, TableFilters } from '../../types';
import { StatusBadge, SearchInput, Pagination, TableSkeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { format } from 'date-fns';

const ORDER_STATUSES = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TableFilters>({ page: 1, limit: 8 });
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersService.getAll(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
      setDeleteOrder(null);
    },
  });

  const formatStatusLabel = (s: string) => {
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

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
            style={{ width: 180 }}
            value={filters.status || ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
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
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary btn-sm font-semibold"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View Order
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon text-red-500 border border-[var(--border)]"
                          title="Delete"
                          onClick={() => setDeleteOrder(order)}
                        >
                          🗑️
                        </button>
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
