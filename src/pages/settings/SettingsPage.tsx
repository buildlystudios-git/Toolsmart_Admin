import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { updateUser, logout } from '../../redux/slices/authSlice';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/modals/ConfirmModal';

const profileSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone'),
});

const passwordSchema = z.object({
  current: z.string().min(1, 'Required'),
  newPass: z.string().min(6, 'Min 6 characters'),
  confirm: z.string(),
}).refine((d) => d.newPass === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  const [logoutAllModal, setLogoutAllModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const handleProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    dispatch(updateUser({ ...data, avatar: avatarPreview }));
    toast.success('Profile updated successfully');
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (data.current !== 'admin123') {
      toast.error('Current password is incorrect. Use "admin123" for demo.');
      setPasswordLoading(false);
      return;
    }
    toast.success('Password changed successfully');
    passwordForm.reset();
    setPasswordLoading(false);
  };

  const handleLogoutAll = async () => {
    await authService.logoutAllDevices();
    dispatch(logout());
    toast.success('Logged out from all devices');
    navigate('/login');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-tertiary)' }}>
        {(['profile', 'security'] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'shadow-sm' : ''}`}
            style={{
              background: tab === t ? 'var(--bg-secondary)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'profile' ? '👤 Profile' : '🔒 Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-5">
          {/* Avatar */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Profile Photo</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.name}&size=80&background=6366f1&color=fff`}
                  alt=""
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                />
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer text-white text-xs shadow-lg"
                  style={{ background: 'var(--accent)' }}>
                  ✏️
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Administrator</p>
                <label className="btn btn-secondary btn-sm mt-2 cursor-pointer inline-flex">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
                { key: 'email', label: 'Email Address', placeholder: 'admin@example.com', type: 'email' },
                { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input {...profileForm.register(key as keyof ProfileForm)} type={type} className="input-field" placeholder={placeholder} />
                  {profileForm.formState.errors[key as keyof ProfileForm] && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors[key as keyof ProfileForm]?.message}</p>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-5">
          {/* Change password */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Use "admin123" as current password for demo</p>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              {[
                { key: 'current', label: 'Current Password', placeholder: '••••••••' },
                { key: 'newPass', label: 'New Password', placeholder: '••••••••' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input {...passwordForm.register(key as keyof PasswordForm)} type="password" className="input-field" placeholder={placeholder} />
                  {passwordForm.formState.errors[key as keyof PasswordForm] && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors[key as keyof PasswordForm]?.message}</p>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : '🔑 Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ borderColor: '#fecaca' }}>
            <h3 className="font-semibold text-sm mb-1 text-red-500">Danger Zone</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              This will log you out from all devices including this one.
            </p>
            <button className="btn btn-danger" onClick={() => setLogoutAllModal(true)}>
              🚪 Logout From All Devices
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={logoutAllModal}
        title="Logout From All Devices"
        message="You will be logged out from all active sessions. Continue?"
        confirmLabel="Logout All"
        variant="danger"
        onConfirm={handleLogoutAll}
        onCancel={() => setLogoutAllModal(false)}
      />
    </div>
  );
}
