import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersService } from '../../services/dataService';
import { StatusBadge, Skeleton } from '../../components/ui';
import { format } from 'date-fns';
import { OrderStatus } from '../../types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rejectionMode, setRejectionMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusSelect, setStatusSelect] = useState('PROCESSING');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getById(id!),
    enabled: !!id,
  });

  // Automatically sync statusSelect with the next logical status (or default)
  useEffect(() => {
    if (order) {
      if (order.orderStatus === 'APPROVED') {
        setStatusSelect('PROCESSING');
      } else if (order.orderStatus === 'PROCESSING') {
        setStatusSelect('SHIPPED');
      } else if (order.orderStatus === 'SHIPPED') {
        setStatusSelect('DELIVERED');
      } else {
        setStatusSelect(order.orderStatus);
      }
    }
  }, [order]);

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: OrderStatus; reason?: string }) =>
      ordersService.updateStatus(id!, status, reason),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order status updated to ${updatedOrder.orderStatus}`);
      setRejectionMode(false);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update order status');
    },
  });

  const handleApprove = () => {
    statusMutation.mutate({ status: 'APPROVED' });
  };

  const handleReject = () => {
    statusMutation.mutate({ status: 'REJECTED', reason: rejectionReason || undefined });
  };

  const handleManualUpdate = () => {
    statusMutation.mutate({ status: statusSelect as OrderStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="card space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) return <div className="p-4 text-center">Order not found</div>;

  const isPending = order.orderStatus === 'PENDING_APPROVAL';
  const isRejected = order.orderStatus === 'REJECTED';
  const isCancelled = order.orderStatus === 'CANCELLED';
  const isDelivered = order.orderStatus === 'DELIVERED';

  const showManualStatusSelect = !isPending && !isRejected && !isCancelled && !isDelivered;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
          ← Back
        </button>
        <h1 className="page-title">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Details and Items */}
        <div className="md:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {order.id}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {format(new Date(order.date), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`badge ${order.deliveryType === 'SELF_PICKUP' ? 'badge-info' : 'badge-purple'}`}>
                  {order.deliveryType === 'SELF_PICKUP' ? 'Self Pickup' : 'Delivery'}
                </span>
                <StatusBadge status={order.orderStatus} />
              </div>
            </div>

            {/* Rejection Reason Box */}
            {isRejected && (
              <div className="mb-5 p-4 rounded-xl border border-red-200 dark:border-red-900/30 text-sm" style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)' }}>
                <p className="font-semibold">❌ Order Rejected</p>
                <p className="mt-1">
                  <strong>Reason:</strong> {order.rejectionReason || 'No reason provided'}
                </p>
              </div>
            )}

            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Order Items
            </h3>
            <div className="space-y-2.5">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.productName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Quantity: <span className="font-medium text-[var(--text-secondary)]">{item.quantity}</span>
                    </p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    ₹{item.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border)] mt-5 pt-4 space-y-2">
              {order.couponCode && (order.discountAmount ?? 0) > 0 ? (
                <>
                  <div className="flex justify-between items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>₹{order.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>🏷️ Coupon Applied ({order.couponCode})</span>
                    <span>- ₹{(order.discountAmount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-[var(--border)]">
                    <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                      ₹{(order.grandTotal ?? order.amount).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>₹{order.amount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Actions & Info Sidebar */}
        <div className="space-y-5">
          {/* Status Management Box */}
          <div className="card space-y-4">
            <h3 className="font-bold text-sm border-b border-[var(--border)] pb-2.5" style={{ color: 'var(--text-primary)' }}>
              Order Actions
            </h3>

            {/* Approval Workflow */}
            {isPending && (
              <div className="space-y-4">
                {!rejectionMode ? (
                  <div className="flex flex-col gap-2">
                    <button
                      className="btn btn-primary justify-center w-full"
                      onClick={handleApprove}
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending ? 'Processing...' : '✅ Approve Order'}
                    </button>
                    <button
                      className="btn btn-secondary justify-center w-full text-red-500 border-red-200 hover:bg-red-50/50"
                      onClick={() => setRejectionMode(true)}
                      disabled={statusMutation.isPending}
                    >
                      ❌ Reject Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Item is currently out of stock..."
                      className="input-field resize-none text-xs"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm flex-1 justify-center text-xs"
                        onClick={() => setRejectionMode(false)}
                        disabled={statusMutation.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm flex-1 justify-center text-xs font-bold"
                        onClick={handleReject}
                        disabled={statusMutation.isPending}
                      >
                        {statusMutation.isPending ? 'Saving...' : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Status Advancer Dropdown */}
            {showManualStatusSelect && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Update Status
                </label>
                <div className="flex flex-col gap-2">
                  <select
                    value={statusSelect}
                    onChange={(e) => setStatusSelect(e.target.value)}
                    className="input-field py-2"
                  >
                    {order.orderStatus === 'APPROVED' && (
                      <option value="PROCESSING">Processing</option>
                    )}
                    {(order.orderStatus === 'APPROVED' || order.orderStatus === 'PROCESSING') && (
                      <option value="SHIPPED">Shipped</option>
                    )}
                    {(order.orderStatus === 'APPROVED' || order.orderStatus === 'PROCESSING' || order.orderStatus === 'SHIPPED') && (
                      <option value="DELIVERED">Delivered</option>
                    )}
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button
                    className="btn btn-primary justify-center w-full mt-1"
                    onClick={handleManualUpdate}
                    disabled={statusMutation.isPending}
                  >
                    {statusMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      'Update Status'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Inactive state info (Delivered/Cancelled) */}
            {(isDelivered || isCancelled) && (
              <div className="text-center py-3 text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
                {isDelivered ? '🎉 Order delivered successfully' : '🚫 Order was cancelled'}
              </div>
            )}
          </div>

          {/* Customer Info Card */}
          <div className="card space-y-3.5">
            <h3 className="font-bold text-sm border-b border-[var(--border)] pb-2.5" style={{ color: 'var(--text-primary)' }}>
              Customer Details
            </h3>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Name</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Phone Number</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{order.phoneNumber || 'N/A'}</p>
            </div>
            {order.address && order.deliveryType !== 'SELF_PICKUP' && (
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Delivery Address</p>
                <p className="text-sm font-medium mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{order.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
