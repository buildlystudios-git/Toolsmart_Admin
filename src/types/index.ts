export interface Address {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  workplaceImage?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified?: boolean;
  phone: string;
  isPhoneNumberVerified?: boolean;
  avatar?: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  registrationDate: string;
  lastLogin?: string;
  addresses?: Address[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Order Types
export type OrderStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  rejectionReason?: string;
  items: OrderItem[];
  date: string;
  address?: string;
  phoneNumber?: string;
  deliveryType?: string;
  couponCode?: string | null;
  discountAmount?: number;
  grandTotal?: number;
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
  about?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  brand?: string;
  order?: number;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  expiryDate: string;
  isActive?: boolean;
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

export interface LegalDocument {
  id: string;
  type: 'TERMS_AND_CONDITIONS' | 'PRIVACY_POLICY' | 'ABOUT_US';
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

