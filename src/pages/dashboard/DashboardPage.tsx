import { mockDashboardStats, salesData, userGrowthData, mockActivities } from '../../utils/mockData';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../redux/hooks';

const statCards = [
  { label: 'Total Users', value: (s: typeof mockDashboardStats) => s.totalUsers.toLocaleString(), icon: '👥', color: '#6366f1', bg: 'bg-violet-500' },
  { label: 'Active Users', value: (s: typeof mockDashboardStats) => s.activeUsers.toLocaleString(), icon: '✅', color: '#10b981', bg: 'bg-emerald-500' },
  { label: 'Suspended', value: (s: typeof mockDashboardStats) => s.suspendedUsers.toLocaleString(), icon: '🚫', color: '#ef4444', bg: 'bg-red-500' },
  { label: 'Total Orders', value: (s: typeof mockDashboardStats) => s.totalOrders.toLocaleString(), icon: '📦', color: '#3b82f6', bg: 'bg-blue-500' },
  { label: 'Pending Orders', value: (s: typeof mockDashboardStats) => s.pendingOrders.toLocaleString(), icon: '⏳', color: '#f59e0b', bg: 'bg-amber-500' },
  { label: 'Completed', value: (s: typeof mockDashboardStats) => s.completedOrders.toLocaleString(), icon: '🎉', color: '#10b981', bg: 'bg-emerald-500' },
  { label: 'Categories', value: (s: typeof mockDashboardStats) => s.totalCategories.toLocaleString(), icon: '🏷️', color: '#8b5cf6', bg: 'bg-purple-500' },
  { label: 'Products', value: (s: typeof mockDashboardStats) => s.totalProducts.toLocaleString(), icon: '🛍️', color: '#ec4899', bg: 'bg-pink-500' },
  { label: 'Revenue', value: (s: typeof mockDashboardStats) => `₹${(s.revenue / 100000).toFixed(1)}L`, icon: '💰', color: '#059669', bg: 'bg-emerald-600' },
];

function useChartColors() {
  const { mode } = useAppSelector((s) => s.theme);
  return {
    grid: mode === 'dark' ? '#1e293b' : '#f1f5f9',
    text: mode === 'dark' ? '#64748b' : '#94a3b8',
    tooltipBg: mode === 'dark' ? '#1e293b' : '#ffffff',
    tooltipBorder: mode === 'dark' ? '#334155' : '#e2e8f0',
  };
}

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const colors = useChartColors();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 shadow-lg text-xs" style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.name === 'sales' ? `₹${p.value.toLocaleString()}` : p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card hover:shadow-md group cursor-default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{card.value(stats)}</p>
              </div>
              <div className={`stat-card-icon ${card.bg} opacity-90 group-hover:opacity-100 transition-opacity`}>
                <span className="text-xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Sales Analytics</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly revenue overview</p>
            </div>
            <span className="badge badge-success">+18.2% YoY</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.text, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" name="sales" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="card">
          <div className="mb-6">
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Orders Analytics</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly order volume</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesData.slice(6)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Growth + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>User Growth</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Cumulative registered users</p>
            </div>
            <span className="badge badge-info">+{Math.round(((userGrowthData[11].users - userGrowthData[0].users) / userGrowthData[0].users) * 100)}% this year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowthData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: colors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="users" name="users" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {activity.avatar ? (
                  <img src={activity.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: 'var(--bg-tertiary)' }}>
                    {activity.type === 'order' ? '📦' : activity.type === 'product' ? '🛍️' : '🏷️'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{activity.message}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
