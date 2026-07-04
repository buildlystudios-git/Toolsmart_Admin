import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { couponsService } from '../../services/dataService';
import { Coupon } from '../../types';
import { Skeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Drawer from '../../components/modals/Drawer';
import { format, parseISO } from 'date-fns';

const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric (dashes/underscores allowed)'),
  type: z.enum(['flat', 'percentage']),
  value: z.coerce.number().min(1, 'Value must be positive'),
  minOrderAmount: z.coerce.number().min(0, 'Minimum order amount must be non-negative'),
  maxDiscount: z.coerce.number().min(0, 'Maximum discount must be non-negative'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

type CouponForm = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: couponsService.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
  });

  const createMutation = useMutation({
    mutationFn: couponsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created');
      setDrawerOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create coupon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      couponsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon updated');
      setEditCoupon(null);
      setDrawerOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update coupon');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
      setDeleteCoupon(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete coupon');
    },
  });

  const openCreate = () => {
    setEditCoupon(null);
    // Set default expiry date to 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    reset({
      code: '',
      type: 'flat',
      value: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      expiryDate: format(defaultExpiry, "yyyy-MM-dd'T'HH:mm"),
    });
    setDrawerOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    let formattedExpiry = '';
    try {
      formattedExpiry = format(parseISO(coupon.expiryDate), "yyyy-MM-dd'T'HH:mm");
    } catch {
      formattedExpiry = coupon.expiryDate ? coupon.expiryDate.slice(0, 16) : '';
    }

    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      expiryDate: formattedExpiry,
    });
    setDrawerOpen(true);
  };

  const onSubmit = (data: CouponForm) => {
    const payload = {
      ...data,
      expiryDate: new Date(data.expiryDate).toISOString(),
    };
    if (editCoupon) {
      updateMutation.mutate({ id: editCoupon.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredCoupons = (coupons ?? []).filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-subtitle">{filteredCoupons.length} coupons configured</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Coupon
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search coupons by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : !filteredCoupons.length ? (
        <EmptyState
          icon="🎟️"
          title="No coupons found"
          subtitle={searchQuery ? 'Try a different search query' : 'Create your first discount coupon'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCoupons.map((coupon) => {
            const isExpired = new Date(coupon.expiryDate) < new Date();
            return (
              <div
                key={coupon.id}
                className="relative flex rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: isExpired ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)',
                }}
              >
                {/* Left Side: Badge Discount */}
                <div
                  className="w-1/3 flex flex-col items-center justify-center p-4 text-white text-center select-none"
                  style={{
                    background: isExpired
                      ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                      : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                  }}
                >
                  <p className="text-2xl font-bold font-mono">
                    {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                  </p>
                  <p className="text-xs uppercase mt-1 tracking-wider opacity-90 font-medium">OFF</p>
                  {isExpired && (
                    <span className="mt-2 bg-black/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Expired
                    </span>
                  )}
                </div>

                {/* Dashed Separator */}
                <div className="relative flex flex-col justify-between items-center w-0 border-r border-dashed border-[var(--border)] my-3 h-[calc(100%-24px)] select-none">
                  <div className="absolute -top-6 -left-2 w-4 h-4 rounded-full" style={{ background: 'var(--bg-primary)' }} />
                  <div className="absolute -bottom-6 -left-2 w-4 h-4 rounded-full" style={{ background: 'var(--bg-primary)' }} />
                </div>

                {/* Right Side: Details & Actions */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <span
                        className="font-mono text-base font-bold bg-[var(--bg-primary)] px-2.5 py-1 rounded-xl border"
                        style={{
                          color: 'var(--accent)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        {coupon.code}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-sm btn-icon p-1 rounded-lg text-xs"
                          title="Edit"
                          onClick={() => openEdit(coupon)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon p-1 rounded-lg text-xs text-red-500"
                          title="Delete"
                          onClick={() => setDeleteCoupon(coupon)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-[var(--text-secondary)]">
                      <p>
                        🎯 Min. Order: <strong style={{ color: 'var(--text-primary)' }}>₹{coupon.minOrderAmount}</strong>
                      </p>
                      {coupon.type === 'percentage' && (
                        <p>
                          🛑 Max Discount: <strong style={{ color: 'var(--text-primary)' }}>₹{coupon.maxDiscount}</strong>
                        </p>
                      )}
                      <p>
                        📅 Expiry:{' '}
                        <strong
                          style={{
                            color: isExpired ? 'var(--danger)' : 'var(--text-primary)',
                          }}
                        >
                          {format(new Date(coupon.expiryDate), 'MMM d, yyyy h:mm a')}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        title={editCoupon ? 'Edit Coupon' : 'Create Coupon'}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Coupon Code *
            </label>
            <input
              {...register('code')}
              className="input-field font-mono uppercase"
              placeholder="e.g. SAVE20"
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Discount Type *
              </label>
              <select {...register('type')} className="input-field">
                <option value="flat">Flat Cash Discount</option>
                <option value="percentage">Percentage Discount</option>
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Discount Value *
              </label>
              <input
                {...register('value')}
                type="number"
                className="input-field"
                placeholder="e.g. 50"
              />
              {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Min. Order Amount (₹)
              </label>
              <input
                {...register('minOrderAmount')}
                type="number"
                className="input-field"
                placeholder="e.g. 500"
              />
              {errors.minOrderAmount && (
                <p className="text-xs text-red-500 mt-1">{errors.minOrderAmount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Max Discount Limit (₹)
              </label>
              <input
                {...register('maxDiscount')}
                type="number"
                className="input-field"
                placeholder="e.g. 100"
              />
              {errors.maxDiscount && (
                <p className="text-xs text-red-500 mt-1">{errors.maxDiscount.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Expiry Date & Time *
            </label>
            <input
              {...register('expiryDate')}
              type="datetime-local"
              className="input-field"
            />
            {errors.expiryDate && (
              <p className="text-xs text-red-500 mt-1">{errors.expiryDate.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 justify-center"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                  </svg>
                  Saving...
                </span>
              ) : editCoupon ? (
                'Update Coupon'
              ) : (
                'Create Coupon'
              )}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        open={!!deleteCoupon}
        title="Delete Coupon"
        message={`Delete coupon code "${deleteCoupon?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteCoupon && deleteMutation.mutate(deleteCoupon.id)}
        onCancel={() => setDeleteCoupon(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
