import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usersService } from '../../services/dataService';
import { User, TableFilters } from '../../types';
import { StatusBadge, SearchInput, Pagination, TableSkeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { format } from 'date-fns';

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TableFilters>({ page: 1, limit: 8, search: '', sortBy: 'name', sortOrder: 'asc' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersService.getAll(filters),
  });

  const handleSort = (col: string) => {
    setFilters((f) => ({ ...f, sortBy: col, sortOrder: f.sortBy === col && f.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 }));
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 opacity-50">
      {filters.sortBy === col ? (filters.sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{data?.total ?? 0} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={filters.search || ''}
            onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
            placeholder="Search users..."
          />
          <select
            className="input-field py-2"
            style={{ width: 150 }}
            value={filters.status || ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          {(filters.search || filters.status) && (
            <button className="btn btn-ghost btn-sm text-red-500" onClick={() => setFilters({ page: 1, limit: 8 })}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                {[['Name', 'name'], ['Phone', ''], ['Email', 'email'], ['Registered', 'registrationDate'], ['Status', 'status'], ['Actions', '']].map(([label, col]) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${col ? 'cursor-pointer hover:opacity-80' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => col && handleSort(col)}
                  >
                    {label}{col && <SortIcon col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-6"><TableSkeleton rows={6} cols={6} /></td></tr>
              ) : !data?.data.length ? (
                <tr><td colSpan={6}><EmptyState icon="👥" title="No users found" /></td></tr>
              ) : (
                data.data.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{user.phone}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(user.registrationDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button 
                          className="btn btn-secondary btn-sm font-semibold" 
                          title="View Profile" 
                          onClick={() => navigate(`/users/${user.id}`, { state: { user } })}
                        >
                          View Profile
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
    </div>
  );
}
