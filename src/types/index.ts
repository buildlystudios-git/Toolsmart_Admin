// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  registrationDate: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  items: OrderItem[];
  date: string;
  address?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  status: 'active' | 'inactive';
  productCount: number;
  createdAt: string;
  urlKey?: string;
  banner?: string;
  parentId?: string | null;
  level?: number;
  order?: number;
}

// Product Types
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  brand?: string;
  banner?: string;
  order?: number;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCategories: number;
  totalProducts: number;
  revenue: number;
}

export interface Activity {
  id: string;
  type: 'order' | 'user' | 'product' | 'category';
  message: string;
  time: string;
  avatar?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TableFilters {
  search?: string;
  status?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
