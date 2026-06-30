/**
 * authService.ts
 *
 * All auth API calls.  Currently mocked — swap the bodies for
 * real AxiosBase calls when your backend is ready.
 */

import AxiosBase from './api';
import { User } from '@/types';

// Mock admin user returned by the server
const MOCK_ADMIN: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@adminpanel.com',
  phone: '+91-9876500000',
  role: 'admin',
  status: 'active',
  registrationDate: '2024-01-01',
  avatar: 'https://i.pravatar.cc/150?img=33',
};

export const authService = {
  /**
   * Step 1 — request OTP
   * Real: POST /auth/send-otp  { phone }
   */
  // src/services/authService.ts

  sendOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await AxiosBase.post('/auth/login', {
      phoneNumber: phone,
      role: 'admin',
    });
    // data = { message: "OTP sent successfully", attempts: 1 }
    return { success: true, message: data.message };
  },

  /**
   * Step 2 — verify OTP → get tokens
   * Real: POST /auth/verify-otp  { phone, otp }
   * Server returns: { accessToken, refreshToken, user }
   */
  verifyOTP: async (
    phone: string,
    otp: string,
  ): Promise<{ user: User; token: string; refreshToken: string }> => {
    const { data } = await AxiosBase.post<{ accessToken: string; refreshToken: string }>(
      '/auth/otp/verify',
      { phoneNumber: phone, otp }
    );

    const { data: userData } = await AxiosBase.get<any>('/users/me', {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });

    return {
      user: mapBackendUserToFrontend(userData),
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  /**
   * Logout — invalidate refresh token on server
   * Real: POST /auth/logout
   */
  logout: async (): Promise<void> => {
    await AxiosBase.post('/auth/logout');
  },

  /**
   * Logout from ALL devices — revoke all refresh tokens for this user
   * Real: POST /auth/logout-all
   */
  logoutAllDevices: async (): Promise<void> => {
    await AxiosBase.post('/auth/logout');
  },

  /**
   * Get current admin profile
   * Real: GET /users/me
   */
  getProfile: async (): Promise<User> => {
    const { data } = await AxiosBase.get<any>('/users/me');
    return mapBackendUserToFrontend(data);
  },

  /**
   * Update profile
   * Real: PATCH /users/me
   */
  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const backendPayload: any = {};
    if (payload.name !== undefined) backendPayload.fullName = payload.name;
    if (payload.email !== undefined) backendPayload.email = payload.email;
    if (payload.phone !== undefined) backendPayload.phoneNumber = payload.phone;
    if (payload.avatar !== undefined) backendPayload.profileImage = payload.avatar;

    const { data } = await AxiosBase.patch<any>('/users/me', backendPayload);
    return mapBackendUserToFrontend(data);
  },

  /**
   * Change password
   * Real: PUT /admin/change-password  { currentPassword, newPassword }
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    await new Promise((r) => setTimeout(r, 700));
    if (currentPassword !== 'admin123')
      throw new Error('Incorrect current password');
    console.log('Password changed to:', newPassword);
  },
};

const mapBackendUserToFrontend = (backendUser: any): User => {
  return {
    id: backendUser._id || backendUser.id || '',
    name: backendUser.fullName || backendUser.name || 'Admin User',
    email: backendUser.email || '',
    phone: backendUser.phoneNumber || backendUser.phone || '',
    avatar: backendUser.profileImage || backendUser.avatar || 'https://i.pravatar.cc/150?img=33',
    role: backendUser.role === 'admin' ? 'admin' : 'user',
    status: backendUser.isDeleted ? 'suspended' : 'active',
    registrationDate: backendUser.createdAt || new Date().toISOString(),
  };
};
