import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../../services/dataService';
import { StatusBadge, Skeleton } from '../../components/ui';
import { format } from 'date-fns';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="card space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div></div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>← Back</button>
        <h1 className="page-title">Order Details</h1>
      </div>

      <div className="card">
        <div className="flex items-start justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{order.id}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{format(new Date(order.date), 'MMMM d, yyyy')}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={order.orderStatus} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: 'Customer', value: order.customerName },
            { label: 'Email', value: order.customerEmail },
            { label: 'Total Amount', value: `₹${order.amount.toLocaleString()}` },
            { label: 'Items', value: order.items.length.toString() },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Order Items</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.productName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>₹{item.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
