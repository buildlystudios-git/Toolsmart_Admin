// Skeleton loader
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-10 ${j === 0 ? 'w-10 rounded-full' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Status Badge
export type StatusType =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'paid'
  | 'unpaid'
  | 'refunded'
  | 'Requested'
  | 'Confirmed'
  | 'In Progress'
  | 'Packed Up'
  | 'Delivered'
  | 'Cancelled';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-gray' },
  suspended: { label: 'Suspended', className: 'badge-danger' },
  pending: { label: 'Pending', className: 'badge-warning' },
  processing: { label: 'Processing', className: 'badge-info' },
  shipped: { label: 'Shipped', className: 'badge-purple' },
  delivered: { label: 'Delivered', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-danger' },
  paid: { label: 'Paid', className: 'badge-success' },
  unpaid: { label: 'Unpaid', className: 'badge-warning' },
  refunded: { label: 'Refunded', className: 'badge-gray' },
  Requested: { label: 'Requested', className: 'badge-warning' },
  Confirmed: { label: 'Confirmed', className: 'badge-info' },
  'In Progress': { label: 'In Progress', className: 'badge-purple' },
  'Packed Up': { label: 'Packed Up', className: 'badge-purple' },
  Delivered: { label: 'Delivered', className: 'badge-success' },
  Cancelled: { label: 'Cancelled', className: 'badge-danger' },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const config = statusConfig[status] || { label: status, className: 'badge-gray' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

// Empty state
export function EmptyState({ icon = '📭', title = 'No data found', subtitle = '' }: { icon?: string; title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-5xl">{icon}</span>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {subtitle && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
    </div>
  );
}

// Pagination
export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center gap-1">
      <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm min-w-[32px] ${p === page ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        ›
      </button>
    </div>
  );
}

// Search input
export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        className="input-field pl-9 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '240px' }}
      />
    </div>
  );
}
