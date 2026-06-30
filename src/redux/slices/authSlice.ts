import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';
import {
  getToken,
  getSavedUser,
  saveAccessToken,
  saveRefreshToken,
  saveUser,
  clearAllTokens,
} from '@/services/tokenStorage';

const initialState: AuthState = {
  user: getSavedUser<User>(),
  token: getToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    loginSuccess(
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken?: string }>,
    ) {
      const { user, token, refreshToken } = action.payload;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Persist via tokenStorage (mirrors UserPrefs in your RN app)
      saveAccessToken(token);
      if (refreshToken) saveRefreshToken(refreshToken);
      saveUser(user);
    },

    /** Called by logoutCallback bridge OR directly (e.g. Logout button). */
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearAllTokens();
    },

    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveUser(state.user);
      }
    },

    /** Called by the refresh interceptor after it saves a new access token. */
    setAccessToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      saveAccessToken(action.payload);
    },

  },
});

export const { setLoading, loginSuccess, logout, updateUser, setAccessToken } =
  authSlice.actions;
export default authSlice.reducer;
