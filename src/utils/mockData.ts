import { User, Order, Category, Product, DashboardStats, Activity } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'Aisha Rahman', email: 'aisha@example.com', phone: '+91-9876543210', role: 'user', status: 'active', registrationDate: '2024-01-15', lastLogin: '2024-03-10', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91-9876543211', role: 'user', status: 'active', registrationDate: '2024-01-20', lastLogin: '2024-03-09', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91-9876543212', role: 'user', status: 'suspended', registrationDate: '2024-02-01', lastLogin: '2024-02-28', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Arjun Patel', email: 'arjun@example.com', phone: '+91-9876543213', role: 'user', status: 'active', registrationDate: '2024-02-10', lastLogin: '2024-03-08', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '5', name: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91-9876543214', role: 'user', status: 'active', registrationDate: '2024-02-15', lastLogin: '2024-03-07', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '6', name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91-9876543215', role: 'user', status: 'suspended', registrationDate: '2024-02-20', avatar: 'https://i.pravatar.cc/150?img=6' },
  { id: '7', name: 'Kavya Nair', email: 'kavya@example.com', phone: '+91-9876543216', role: 'user', status: 'active', registrationDate: '2024-03-01', lastLogin: '2024-03-10', avatar: 'https://i.pravatar.cc/150?img=7' },
  { id: '8', name: 'Amit Kumar', email: 'amit@example.com', phone: '+91-9876543217', role: 'user', status: 'active', registrationDate: '2024-03-05', lastLogin: '2024-03-09', avatar: 'https://i.pravatar.cc/150?img=8' },
  { id: '9', name: 'Divya Reddy', email: 'divya@example.com', phone: '+91-9876543218', role: 'user', status: 'active', registrationDate: '2024-03-08', lastLogin: '2024-03-10', avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: '10', name: 'Rohit Joshi', email: 'rohit@example.com', phone: '+91-9876543219', role: 'user', status: 'active', registrationDate: '2024-03-09', lastLogin: '2024-03-10', avatar: 'https://i.pravatar.cc/150?img=10' },
];

export const mockOrders: Order[] = [
  { id: 'ORD-001', customerId: '1', customerName: 'Aisha Rahman', customerEmail: 'aisha@example.com', amount: 2499, paymentStatus: 'paid', orderStatus: 'DELIVERED', date: '2024-03-01', items: [{ productId: 'p1', productName: 'Wireless Headphones', quantity: 1, price: 2499 }] },
  { id: 'ORD-002', customerId: '2', customerName: 'Vikram Singh', customerEmail: 'vikram@example.com', amount: 4999, paymentStatus: 'paid', orderStatus: 'SHIPPED', date: '2024-03-03', items: [{ productId: 'p2', productName: 'Smart Watch', quantity: 1, price: 4999 }] },
  { id: 'ORD-003', customerId: '3', customerName: 'Priya Sharma', customerEmail: 'priya@example.com', amount: 1299, paymentStatus: 'unpaid', orderStatus: 'PENDING_APPROVAL', date: '2024-03-05', items: [{ productId: 'p3', productName: 'Phone Case', quantity: 2, price: 649.5 }] },
  { id: 'ORD-004', customerId: '4', customerName: 'Arjun Patel', customerEmail: 'arjun@example.com', amount: 7999, paymentStatus: 'paid', orderStatus: 'PROCESSING', date: '2024-03-06', items: [{ productId: 'p4', productName: 'Bluetooth Speaker', quantity: 1, price: 7999 }] },
  { id: 'ORD-005', customerId: '5', customerName: 'Sneha Gupta', customerEmail: 'sneha@example.com', amount: 3599, paymentStatus: 'paid', orderStatus: 'DELIVERED', date: '2024-03-07', items: [{ productId: 'p5', productName: 'USB-C Hub', quantity: 1, price: 3599 }] },
  { id: 'ORD-006', customerId: '6', customerName: 'Rahul Verma', customerEmail: 'rahul@example.com', amount: 899, paymentStatus: 'refunded', orderStatus: 'CANCELLED', date: '2024-03-07', items: [{ productId: 'p6', productName: 'Screen Protector', quantity: 3, price: 299.67 }] },
  { id: 'ORD-007', customerId: '7', customerName: 'Kavya Nair', customerEmail: 'kavya@example.com', amount: 12999, paymentStatus: 'paid', orderStatus: 'SHIPPED', date: '2024-03-08', items: [{ productId: 'p7', productName: 'Mechanical Keyboard', quantity: 1, price: 12999 }] },
  { id: 'ORD-008', customerId: '8', customerName: 'Amit Kumar', customerEmail: 'amit@example.com', amount: 5499, paymentStatus: 'paid', orderStatus: 'PROCESSING', date: '2024-03-09', items: [{ productId: 'p8', productName: 'Gaming Mouse', quantity: 1, price: 5499 }] },
  { id: 'ORD-009', customerId: '9', customerName: 'Divya Reddy', customerEmail: 'divya@example.com', amount: 2199, paymentStatus: 'unpaid', orderStatus: 'PENDING_APPROVAL', date: '2024-03-09', items: [{ productId: 'p9', productName: 'Webcam HD', quantity: 1, price: 2199 }] },
  { id: 'ORD-010', customerId: '10', customerName: 'Rohit Joshi', customerEmail: 'rohit@example.com', amount: 9899, paymentStatus: 'paid', orderStatus: 'DELIVERED', date: '2024-03-10', items: [{ productId: 'p10', productName: 'Monitor Stand', quantity: 1, price: 9899 }] },
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics', description: 'Gadgets and electronic devices', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop', status: 'active', productCount: 45, createdAt: '2024-01-01' },
  { id: 'cat-2', name: 'Accessories', description: 'Phone and laptop accessories', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop', status: 'active', productCount: 32, createdAt: '2024-01-05' },
  { id: 'cat-3', name: 'Audio', description: 'Headphones, speakers and audio equipment', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop', status: 'active', productCount: 18, createdAt: '2024-01-10' },
  { id: 'cat-4', name: 'Gaming', description: 'Gaming peripherals and accessories', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop', status: 'active', productCount: 27, createdAt: '2024-01-15' },
  { id: 'cat-5', name: 'Wearables', description: 'Smartwatches and fitness trackers', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop', status: 'inactive', productCount: 12, createdAt: '2024-02-01' },
];

export const mockProducts: Product[] = [
  { id: 'p1', categoryId: 'cat-1', name: 'Wireless Earbuds Pro', description: 'Premium wireless earbuds with ANC', price: 2499, discountPrice: 1999, stock: 150, images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-01-15' },
  { id: 'p2', categoryId: 'cat-5', name: 'Smart Watch Series 8', description: 'Feature-rich smartwatch with health monitoring', price: 4999, stock: 80, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-01-20' },
  { id: 'p3', categoryId: 'cat-2', name: 'MagSafe Phone Case', description: 'Premium protective phone case', price: 649, stock: 300, images: ['https://images.unsplash.com/photo-1601593346740-925612772716?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-02-01' },
  { id: 'p4', categoryId: 'cat-3', name: 'Portable Bluetooth Speaker', description: '360° surround sound speaker', price: 7999, discountPrice: 6499, stock: 60, images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-02-05' },
  { id: 'p5', categoryId: 'cat-2', name: '12-in-1 USB-C Hub', description: 'Multiport hub for laptops', price: 3599, stock: 120, images: ['https://images.unsplash.com/photo-1591238372338-e769cfbd0470?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-02-10' },
  { id: 'p6', categoryId: 'cat-2', name: 'Tempered Glass Screen Protector', description: '9H hardness screen protection', price: 299, stock: 500, images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-02-15' },
  { id: 'p7', categoryId: 'cat-4', name: 'Mechanical Gaming Keyboard', description: 'RGB backlit mechanical keyboard', price: 12999, discountPrice: 10999, stock: 45, images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-02-20' },
  { id: 'p8', categoryId: 'cat-4', name: 'Precision Gaming Mouse', description: '16000 DPI gaming mouse', price: 5499, stock: 90, images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-03-01' },
  { id: 'p9', categoryId: 'cat-1', name: 'Full HD Webcam', description: '1080p webcam with built-in mic', price: 2199, stock: 75, images: ['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=300&h=300&fit=crop'], status: 'inactive', createdAt: '2024-03-05' },
  { id: 'p10', categoryId: 'cat-2', name: 'Ergonomic Monitor Stand', description: 'Adjustable aluminum monitor stand', price: 9899, discountPrice: 8499, stock: 35, images: ['https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=300&h=300&fit=crop'], status: 'active', createdAt: '2024-03-08' },
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 1284,
  activeUsers: 1147,
  suspendedUsers: 137,
  totalOrders: 4823,
  pendingOrders: 342,
  completedOrders: 3891,
  totalCategories: 12,
  totalProducts: 284,
  revenue: 2847650,
};

export const mockActivities: Activity[] = [
  { id: '1', type: 'order', message: 'New order #ORD-010 placed by Rohit Joshi', time: '2 min ago', avatar: 'https://i.pravatar.cc/150?img=10' },
  { id: '2', type: 'user', message: 'New user Kavya Nair registered', time: '15 min ago', avatar: 'https://i.pravatar.cc/150?img=7' },
  { id: '3', type: 'order', message: 'Order #ORD-007 shipped successfully', time: '1 hour ago', avatar: 'https://i.pravatar.cc/150?img=7' },
  { id: '4', type: 'product', message: 'Product "Gaming Mouse" stock updated', time: '2 hours ago' },
  { id: '5', type: 'order', message: 'Order #ORD-006 cancelled and refunded', time: '3 hours ago', avatar: 'https://i.pravatar.cc/150?img=6' },
  { id: '6', type: 'category', message: 'New category "Wearables" added', time: '5 hours ago' },
];

export const salesData = [
  { month: 'Jan', sales: 42000, orders: 320 },
  { month: 'Feb', sales: 58000, orders: 425 },
  { month: 'Mar', sales: 45000, orders: 350 },
  { month: 'Apr', sales: 72000, orders: 520 },
  { month: 'May', sales: 68000, orders: 490 },
  { month: 'Jun', sales: 84000, orders: 610 },
  { month: 'Jul', sales: 91000, orders: 680 },
  { month: 'Aug', sales: 78000, orders: 570 },
  { month: 'Sep', sales: 95000, orders: 720 },
  { month: 'Oct', sales: 112000, orders: 840 },
  { month: 'Nov', sales: 134000, orders: 980 },
  { month: 'Dec', sales: 158000, orders: 1140 },
];

export const userGrowthData = [
  { month: 'Jan', users: 820 },
  { month: 'Feb', users: 932 },
  { month: 'Mar', users: 1001 },
  { month: 'Apr', users: 1080 },
  { month: 'May', users: 1110 },
  { month: 'Jun', users: 1145 },
  { month: 'Jul', users: 1170 },
  { month: 'Aug', users: 1195 },
  { month: 'Sep', users: 1220 },
  { month: 'Oct', users: 1248 },
  { month: 'Nov', users: 1272 },
  { month: 'Dec', users: 1284 },
];
