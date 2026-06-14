# AdminOS — Admin Panel

A modern, production-ready Admin Panel built with React.js, TypeScript, Tailwind CSS, Redux Toolkit, React Query, and React Hook Form.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔑 Demo Credentials

- **Phone**: Any 10-digit number (e.g., `9876543210`)
- **OTP**: `123456`
- **Change Password**: Use `admin123` as current password

## 📁 Project Structure

```
src/
├── components/
│   ├── common/        # Sidebar, Header
│   ├── modals/        # ConfirmModal, Drawer
│   └── ui/            # Reusable UI components
├── layouts/           # AdminLayout, AuthLayout
├── pages/
│   ├── auth/          # LoginPage (Phone + OTP)
│   ├── dashboard/     # Dashboard with charts
│   ├── users/         # Users CRUD
│   ├── orders/        # Orders management
│   ├── categories/    # Categories + Products
│   └── settings/      # Profile & Security
├── redux/
│   └── slices/        # authSlice, themeSlice, sidebarSlice
├── services/          # API layer (mock + axios)
├── types/             # TypeScript interfaces
└── utils/             # mockData, helpers
```

## ✨ Features

- **Authentication**: Phone + OTP login, JWT, auto-session, protected routes
- **Dashboard**: Stats cards, Sales/Orders/User Growth charts, Recent Activity
- **Users**: Table with search, sort, filter, pagination, suspend/activate/delete
- **Orders**: Full order management, status updates, filters
- **Categories**: Card grid, add/edit/delete, activate/deactivate
- **Products**: Belong to categories, full CRUD, image support
- **Settings**: Profile update, password change, logout all devices
- **Dark/Light Theme**: Full system-wide theme toggle
- **Responsive**: Mobile-first design with collapsible sidebar
- **Toast notifications**, **Loading skeletons**, **Confirmation modals**

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | Core framework |
| Tailwind CSS | Styling |
| Redux Toolkit | Global state (auth, theme, sidebar) |
| TanStack React Query | Server state + caching |
| React Hook Form + Zod | Form validation |
| Recharts | Charts and analytics |
| React Router v6 | Routing + protected routes |
| React Hot Toast | Notifications |
| Axios | HTTP client |
| date-fns | Date formatting |

## 🔌 API Integration

The app uses a mock service layer in `src/services/dataService.ts`. To connect to a real API:

1. Update `src/services/api.ts` with your base URL
2. Replace mock service functions with real `api.get/post/put/delete` calls
3. Update `.env`: `VITE_API_URL=https://your-api.com/v1`

## 🎨 Theming

CSS variables in `src/index.css` control all colors. Dark mode uses `.dark` class on `<html>`.
