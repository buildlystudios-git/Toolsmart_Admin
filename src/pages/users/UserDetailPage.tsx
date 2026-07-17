import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../../services/dataService';
import { StatusBadge } from '../../components/ui';
import { Skeleton } from '../../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { User } from '../../types';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const stateUser = location.state?.user as User | undefined;

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['user', id],
    queryFn: async () => {
      if (stateUser) return stateUser;
      const response = await usersService.getAll({ page: 1, limit: 100 });
      return response.data.find((u) => u.id === id) || null;
    },
    enabled: !!id,
    initialData: stateUser || null,
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

        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'User ID', value: user.id },
            { 
              label: 'Email', 
              value: (
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span>{user.email || 'N/A'}</span>
                  {user.isEmailVerified !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${user.isEmailVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  )}
                </span>
              )
            },
            { 
              label: 'Phone', 
              value: (
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span>{user.phone || 'N/A'}</span>
                  {user.isPhoneNumberVerified !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${user.isPhoneNumberVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {user.isPhoneNumberVerified ? 'Verified' : 'Unverified'}
                    </span>
                  )}
                </span>
              )
            },
            { label: 'Role', value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A' },
            { label: 'Registered', value: user.registrationDate ? format(new Date(user.registrationDate), 'MMM d, yyyy') : 'N/A' },
            { label: 'Status', value: <StatusBadge status={user.status} /> },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {user.addresses && user.addresses.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-[var(--text-secondary)]">
              Addresses ({user.addresses.length})
            </h3>
            <div className="space-y-4">
              {user.addresses.map((addr, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Address Line</span>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{addr.addressLine}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">City</span>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{addr.city}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">State</span>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{addr.state}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Pincode</span>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{addr.pincode}</p>
                      </div>
                    </div>
                  </div>
                  {addr.workplaceImage && (
                    <div className="md:w-36 md:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <img src={addr.workplaceImage} alt="Workplace" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
