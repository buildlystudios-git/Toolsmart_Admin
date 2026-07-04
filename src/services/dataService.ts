/**
 * dataService.ts
 *
 * Each function shows the MOCK implementation used today and
 * the commented REAL AxiosBase call to switch to in production.
 *
 * Pattern:
 *   Mock  → runs now, no backend needed
 *   Real  → uncomment + remove mock block when backend is ready
 */

import AxiosBase from './api';
import { mockUsers, mockOrders, mockCategories, mockProducts } from '@/utils/mockData';
import {
  User,
  Order,
  Category,
  Product,
  Coupon,
  TableFilters,
  PaginatedResponse,
} from '@/types';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

import { OrderStatus } from '../types';

const statusMapBackendToFrontend: Record<string, OrderStatus> = {
  'pending': 'PENDING_APPROVAL',
  'confirmed': 'APPROVED',
  'processing': 'PROCESSING',
  'shipped': 'SHIPPED',
  'delivered': 'DELIVERED',
  'cancelled': 'CANCELLED',
};

const mapBackendStatusToFrontend = (status: string): OrderStatus => {
  const norm = status?.toLowerCase() || '';
  if (statusMapBackendToFrontend[norm]) return statusMapBackendToFrontend[norm];
  
  const upper = status?.toUpperCase() as OrderStatus;
  if ([
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ].includes(upper)) {
    return upper;
  }
  return 'PENDING_APPROVAL';
};

const mapFrontendStatusToBackend = (status: string): string => {
  return status;
};

async function getProductLookupMap(): Promise<Record<string, { name: string; image?: string }>> {
  try {
    const { data } = await AxiosBase.get<any>('/products', { params: { limit: 250 } });
    const lookup: Record<string, { name: string; image?: string }> = {};
    if (data && data.data) {
      data.data.forEach((p: any) => {
        lookup[p._id || p.id] = {
          name: p.name,
          image: p.images?.[0] || undefined,
        };
      });
    }
    return lookup;
  } catch (error) {
    console.error('Failed to build product lookup map:', error);
    return {};
  }
}

const mapBackendOrderToFrontend = (backendOrder: any, productLookup: Record<string, { name: string; image?: string }>): Order => {
  return {
    id: backendOrder._id || backendOrder.id || '',
    customerId: backendOrder.userId || '',
    customerName: 'Retail Customer',
    customerEmail: 'retail@toolsmart.com',
    amount: backendOrder.totalAmount || 0,
    paymentStatus: 'paid',
    orderStatus: mapBackendStatusToFrontend(backendOrder.status),
    rejectionReason: backendOrder.rejectionReason || undefined,
    items: (backendOrder.items || []).map((item: any) => {
      const prodId = item.productId?._id || item.productId || '';
      const resolved = productLookup[prodId] || { name: `Product (${prodId.slice(-4)})` };
      return {
        productId: prodId,
        productName: resolved.name,
        quantity: item.quantity || 1,
        price: item.price || 0,
        image: resolved.image,
      };
    }),
    date: backendOrder.createdAt || new Date().toISOString(),
  };
};

// ═══════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════
export const usersService = {
  getAll: async (filters: TableFilters): Promise<PaginatedResponse<User>> => {
    // ── REAL ──────────────────────────────────────────────────
    // const { data } = await AxiosBase.get('/admin/users', { params: filters });
    // return data; // { data[], total, page, limit, totalPages }

    // ── MOCK ──────────────────────────────────────────────────
    await delay();
    let data = [...mockUsers];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
      );
    }
    if (filters.status) data = data.filter((u) => u.status === filters.status);
    if (filters.sortBy) {
      data.sort((a, b) => {
        const va = String(a[filters.sortBy as keyof User] ?? '');
        const vb = String(b[filters.sortBy as keyof User] ?? '');
        return filters.sortOrder === 'desc'
          ? vb.localeCompare(va)
          : va.localeCompare(vb);
      });
    }
    const total = data.length;
    const start = (filters.page - 1) * filters.limit;
    return {
      data: data.slice(start, start + filters.limit),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  },

  getById: async (id: string): Promise<User> => {
    // ── REAL ──────────────────────────────────────────────────
    // const { data } = await AxiosBase.get(`/admin/users/${id}`);
    // return data.user;

    await delay();
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },

  updateStatus: async (
    id: string,
    status: 'active' | 'suspended',
  ): Promise<User> => {
    // ── REAL ──────────────────────────────────────────────────
    // const { data } = await AxiosBase.patch(`/admin/users/${id}/status`, { status });
    // return data.user;

    await delay();
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.status = status;
    return { ...user };
  },

  delete: async (id: string): Promise<void> => {
    // ── REAL ──────────────────────────────────────────────────
    // await AxiosBase.delete(`/admin/users/${id}`);

    await delay();
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx > -1) mockUsers.splice(idx, 1);
  },
};

// ═══════════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════════
export const ordersService = {
  getAll: async (filters: TableFilters): Promise<PaginatedResponse<Order>> => {
    const { data: backendOrders } = await AxiosBase.get<any[]>('/orders');
    const productLookup = await getProductLookupMap();
    
    let orders = backendOrders.map(o => mapBackendOrderToFrontend(o, productLookup));
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q),
      );
    }
    if (filters.status) {
      orders = orders.filter((o) => o.orderStatus === filters.status);
    }
    
    const total = orders.length;
    const start = (filters.page - 1) * filters.limit;
    return {
      data: orders.slice(start, start + filters.limit),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  },

  getById: async (id: string): Promise<Order> => {
    const { data } = await AxiosBase.get<any>(`/orders/${id}`);
    const productLookup = await getProductLookupMap();
    return mapBackendOrderToFrontend(data, productLookup);
  },

  updateStatus: async (id: string, status: string, rejectionReason?: string): Promise<Order> => {
    const { data } = await AxiosBase.patch<any>(`/orders/${id}/status`, { 
      status, 
      rejectionReason 
    });
    const productLookup = await getProductLookupMap();
    return mapBackendOrderToFrontend(data, productLookup);
  },

  delete: async (id: string): Promise<void> => {
    await AxiosBase.post(`/orders/${id}/cancel`);
  },
};

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════════
const mapBackendCategoryToFrontend = (backendCat: any): Category => {
  return {
    id: backendCat._id || backendCat.id || '',
    name: backendCat.name || '',
    description: backendCat.description || '',
    image: backendCat.image || undefined,
    status: backendCat.isActive ? 'active' : 'inactive',
    productCount: backendCat.productCount || 0,
    createdAt: backendCat.createdAt || new Date().toISOString(),
    urlKey: backendCat.urlKey || '',
    parentId: backendCat.parentId || null,
    level: backendCat.level || 0,
    order: backendCat.order || 0,
  };
};

const mapBackendProductToFrontend = (backendProd: any): Product => {
  return {
    id: backendProd._id || backendProd.id || '',
    categoryId: typeof backendProd.categoryId === 'object' && backendProd.categoryId ? backendProd.categoryId._id || backendProd.categoryId.id || '' : backendProd.categoryId || '',
    name: backendProd.name || '',
    description: backendProd.description || '',
    about: backendProd.about || '',
    price: backendProd.mrp || backendProd.price || 0,
    discountPrice: backendProd.mrp && backendProd.price < backendProd.mrp ? backendProd.price : undefined,
    stock: backendProd.quantity || 0,
    images: backendProd.images || [],
    status: backendProd.isActive ? 'active' : 'inactive',
    createdAt: backendProd.createdAt || new Date().toISOString(),
    brand: backendProd.brand || '',
    order: backendProd.order || 0,
  };
};

export const categoriesService = {
  getAll: async (name?: string): Promise<Category[]> => {
    const { data } = await AxiosBase.get<any[]>('/categories', {
      params: name ? { name } : {},
    });
    return data.map(mapBackendCategoryToFrontend);
  },

  getById: async (id: string): Promise<Category> => {
    const { data } = await AxiosBase.get<any[]>('/categories', {
      params: { id },
    });
    if (!data || data.length === 0) throw new Error('Category not found');
    return mapBackendCategoryToFrontend(data[0]);
  },

  create: async (payload: Partial<Category>): Promise<Category> => {
    const backendPayload = {
      name: payload.name,
      description: payload.description,
      urlKey: payload.urlKey || payload.name?.toLowerCase().replace(/\s+/g, '-'),
      image: payload.image,
      parentId: payload.parentId || null,
      level: payload.level || 0,
      order: payload.order || 0,
      isActive: payload.status === 'active',
    };
    const { data } = await AxiosBase.post<any>('/categories', backendPayload);
    return mapBackendCategoryToFrontend(data);
  },

  update: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const backendPayload: any = {};
    if (payload.name !== undefined) {
      backendPayload.name = payload.name;
      backendPayload.urlKey = payload.urlKey || payload.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (payload.description !== undefined) backendPayload.description = payload.description;
    if (payload.urlKey !== undefined) backendPayload.urlKey = payload.urlKey;
    if (payload.image !== undefined) backendPayload.image = payload.image;
    if (payload.parentId !== undefined) backendPayload.parentId = payload.parentId || null;
    if (payload.level !== undefined) backendPayload.level = payload.level;
    if (payload.order !== undefined) backendPayload.order = payload.order;
    if (payload.status !== undefined) backendPayload.isActive = payload.status === 'active';

    const { data } = await AxiosBase.patch<any>(`/categories/${id}`, backendPayload);
    return mapBackendCategoryToFrontend(data);
  },

  delete: async (id: string): Promise<void> => {
    await AxiosBase.delete(`/categories/${id}`);
  },
};

// ═══════════════════════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════════════════════
export const productsService = {
  getByCategoryId: async (categoryId: string, name?: string): Promise<Product[]> => {
    const params: any = { categoryId, limit: 250 };
    if (name) params.name = name;
    const { data } = await AxiosBase.get<any>('/products', { params });
    const list = data.data || [];
    return list.map(mapBackendProductToFrontend);
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await AxiosBase.get<any>('/products', { params: { id } });
    if (!data.data || data.data.length === 0) throw new Error('Product not found');
    return mapBackendProductToFrontend(data.data[0]);
  },

  create: async (payload: Partial<Product>): Promise<Product> => {
    const backendPayload = {
      name: payload.name,
      description: payload.description,
      about: payload.about || '',
      brand: payload.brand || 'Generic',
      mrp: payload.price || 0,
      price: payload.discountPrice || payload.price || 0,
      quantity: payload.stock || 0,
      order: payload.order || 0,
      categoryId: payload.categoryId,
      images: payload.images || [],
      isActive: payload.status === 'active',
    };
    const { data } = await AxiosBase.post<any>('/products', backendPayload);
    return mapBackendProductToFrontend(data);
  },

  update: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const backendPayload: any = {};
    if (payload.name !== undefined) backendPayload.name = payload.name;
    if (payload.description !== undefined) backendPayload.description = payload.description;
    if (payload.about !== undefined) backendPayload.about = payload.about;
    if (payload.brand !== undefined) backendPayload.brand = payload.brand;
    if (payload.price !== undefined) backendPayload.mrp = payload.price;
    if (payload.discountPrice !== undefined) {
      backendPayload.price = payload.discountPrice;
    } else if (payload.price !== undefined) {
      backendPayload.price = payload.price;
    }
    if (payload.stock !== undefined) backendPayload.quantity = payload.stock;
    if (payload.order !== undefined) backendPayload.order = payload.order;
    if (payload.categoryId !== undefined) backendPayload.categoryId = payload.categoryId;
    if (payload.images !== undefined) backendPayload.images = payload.images;
    if (payload.status !== undefined) backendPayload.isActive = payload.status === 'active';

    const { data } = await AxiosBase.patch<any>(`/products/${id}`, backendPayload);
    return mapBackendProductToFrontend(data);
  },

  delete: async (id: string): Promise<void> => {
    await AxiosBase.delete(`/products/${id}`);
  },

  toggleStatus: async (
    id: string,
    status: 'active' | 'inactive',
  ): Promise<Product> => {
    return productsService.update(id, { status });
  },
};

// ═══════════════════════════════════════════════════════════════
//  COUPONS
// ═══════════════════════════════════════════════════════════════
const mapBackendCouponToFrontend = (backendCoupon: any): Coupon => {
  return {
    id: backendCoupon._id || backendCoupon.id || '',
    code: backendCoupon.code || '',
    type: backendCoupon.type || 'flat',
    value: backendCoupon.value || 0,
    minOrderAmount: backendCoupon.minOrderAmount || 0,
    maxDiscount: backendCoupon.maxDiscount || 0,
    expiryDate: backendCoupon.expiryDate || '',
    isActive: backendCoupon.isActive !== undefined ? backendCoupon.isActive : true,
  };
};

export const couponsService = {
  getAll: async (): Promise<Coupon[]> => {
    const { data } = await AxiosBase.get<any[]>('/coupons');
    return data.map(mapBackendCouponToFrontend);
  },

  getById: async (id: string): Promise<Coupon> => {
    const { data } = await AxiosBase.get<any[]>('/coupons', {
      params: { id },
    });
    if (!data || data.length === 0) throw new Error('Coupon not found');
    return mapBackendCouponToFrontend(data[0]);
  },

  create: async (payload: Partial<Coupon>): Promise<Coupon> => {
    const { data } = await AxiosBase.post<any>('/coupons', payload);
    return mapBackendCouponToFrontend(data);
  },

  update: async (id: string, payload: Partial<Coupon>): Promise<Coupon> => {
    const { data } = await AxiosBase.patch<any>(`/coupons/${id}`, payload);
    return mapBackendCouponToFrontend(data);
  },

  delete: async (id: string): Promise<void> => {
    await AxiosBase.delete(`/coupons/${id}`);
  },
};
