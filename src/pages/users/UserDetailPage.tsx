import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../../services/dataService';
import { StatusBadge } from '../../components/ui';
import { Skeleton } from '../../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersService.getById(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: 'active' | 'suspended' }) => usersService.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['user', id] }); queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated'); },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="card space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </div>
    );
  }

  if (!user) return <div>User not found</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/users')}>← Back</button>
        <h1 className="page-title">User Details</h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-5 pb-5 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&size=80`} alt="" className="w-20 h-20 rounded-2xl object-cover" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
            <div className="mt-2"><StatusBadge status={user.status} /></div>
          </div>
          <div className="ml-auto">
            <button
              className={`btn ${user.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => statusMutation.mutate({ status: user.status === 'active' ? 'suspended' : 'active' })}
            >
              {user.status === 'active' ? '🚫 Suspend' : '✅ Activate'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'User ID', value: user.id },
            { label: 'Phone', value: user.phone },
            { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            { label: 'Registered', value: format(new Date(user.registrationDate), 'MMM d, yyyy') },
            { label: 'Last Login', value: user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : 'Never' },
            { label: 'Status', value: <StatusBadge status={user.status} /> },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
