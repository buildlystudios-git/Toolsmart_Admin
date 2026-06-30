import { createSlice } from '@reduxjs/toolkit';

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState: {
    isCollapsed: false,
    isMobileOpen: false,
  },
  reducers: {
    toggleCollapse(state) {
      state.isCollapsed = !state.isCollapsed;
    },
    setCollapsed(state, action) {
      state.isCollapsed = action.payload;
    },
    toggleMobile(state) {
      state.isMobileOpen = !state.isMobileOpen;
    },
    setMobileOpen(state, action) {
      state.isMobileOpen = action.payload;
    },
  },
});

export const { toggleCollapse, setCollapsed, toggleMobile, setMobileOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;
