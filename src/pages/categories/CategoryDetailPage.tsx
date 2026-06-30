import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { categoriesService, productsService } from '../../services/dataService';
import { Product } from '../../types';
import { StatusBadge, Skeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Drawer from '../../components/modals/Drawer';

const productSchema = z.object({
  name: z.string().min(2, 'Required'),
  description: z.string().min(5, 'Required'),
  brand: z.string().optional(),
  banner: z.string().optional(),
  price: z.coerce.number().min(0, 'MRP must be non-negative'),
  discountPrice: z.coerce.number().min(0, 'Price must be non-negative').optional(),
  stock: z.coerce.number().min(0, 'Stock must be non-negative'),
  order: z.preprocess((val) => (val === '' || val === undefined ? 0 : Number(val)), z.number().int().nonnegative().default(0)),
  images: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
});
type ProductForm = z.infer<typeof productSchema>;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ['category', id], queryFn: () => categoriesService.getById(id!), enabled: !!id,
  });

  const { data: products, isLoading: prodsLoading } = useQuery({
    queryKey: ['products', id], queryFn: () => productsService.getByCategoryId(id!), enabled: !!id,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({ resolver: zodResolver(productSchema) });
  const watchImages = watch('images') || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productsService.create({ ...data, categoryId: id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products', id] }); toast.success('Product created'); setDrawerOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ pid, data }: { pid: string; data: Partial<Product> }) => productsService.update(pid, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products', id] }); toast.success('Product updated'); setDrawerOpen(false); setEditProduct(null); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (pid: string) => productsService.delete(pid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products', id] }); toast.success('Product deleted'); setDeleteProduct(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ pid, status }: { pid: string; status: 'active' | 'inactive' }) => productsService.update(pid, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products', id] }); toast.success('Status updated'); },
  });

  const openCreate = () => {
    setEditProduct(null);
    reset({
      name: '',
      description: '',
      brand: '',
      banner: '',
      price: 0,
      discountPrice: undefined,
      stock: 0,
      order: 0,
      images: [],
      status: 'active',
    });
    setDrawerOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    reset({
      name: p.name,
      description: p.description,
      brand: p.brand || '',
      banner: p.banner || '',
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      order: p.order ?? 0,
      images: p.images || [],
      status: p.status || 'active',
    });
    setDrawerOpen(true);
  };

  const onSubmit = (data: ProductForm) => {
    const payload = {
      name: data.name,
      description: data.description,
      brand: data.brand || 'Generic',
      banner: data.banner || '',
      price: data.price,
      discountPrice: data.discountPrice,
      stock: data.stock,
      order: data.order ?? 0,
      images: data.images || [],
      status: data.status,
    };
    if (editProduct) updateMutation.mutate({ pid: editProduct.id, data: payload });
    else createMutation.mutate(payload);
  };

  if (catLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="card"><Skeleton className="h-40" /></div></div>;
  if (!category) return <div>Category not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/categories')}>← Back</button>
        <h1 className="page-title">Category Details</h1>
      </div>

      {/* Category Info */}
      <div className="card">
        <div className="flex gap-5">
          {category.image && (
            <img src={category.image} alt={category.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{category.name}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{category.description}</p>
              </div>
              <StatusBadge status={category.status} />
            </div>
            <div className="flex gap-4 mt-3">
              <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', minWidth: 60 }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{products?.length ?? 0}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Products</h2>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Product</button>
        </div>

        {prodsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="card"><Skeleton className="h-48 mb-3" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>)}
          </div>
        ) : !products?.length ? (
          <EmptyState icon="🛍️" title="No products yet" subtitle="Add your first product to this category" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
                {product.images[0] && (
                  <div className="h-44 overflow-hidden">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    {product.discountPrice ? (
                      <>
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>₹{product.discountPrice}</span>
                        <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>₹{product.price}</span>
                      </>
                    ) : (
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>₹{product.price}</span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Stock: {product.stock}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm flex-1" onClick={() => openEdit(product)}>✏️ Edit</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleMutation.mutate({ pid: product.id, status: product.status === 'active' ? 'inactive' : 'active' })}>
                      {product.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon text-red-500" onClick={() => setDeleteProduct(product)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Drawer */}
      <Drawer open={drawerOpen} title={editProduct ? 'Edit Product' : 'Add Product'} onClose={() => { setDrawerOpen(false); setEditProduct(null); }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Product Name *</label>
            <input {...register('name')} className="input-field" placeholder="e.g. Cordless Drill" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Product specifications..." />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Brand</label>
              <input {...register('brand')} className="input-field" placeholder="e.g. Bosch" />
              {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display Order</label>
              <input {...register('order')} type="number" className="input-field" placeholder="0" />
              {errors.order && <p className="text-xs text-red-500 mt-1">{errors.order.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banner HTML/Text</label>
            <textarea {...register('banner')} rows={2} className="input-field resize-none" placeholder="Banner text or HTML..." />
            {errors.banner && <p className="text-xs text-red-500 mt-1">{errors.banner.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>MRP (₹) *</label>
              <input {...register('price')} type="number" className="input-field" placeholder="999" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Selling Price (₹)</label>
              <input {...register('discountPrice')} type="number" className="input-field" placeholder="799" />
              {errors.discountPrice && <p className="text-xs text-red-500 mt-1">{errors.discountPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stock Qty *</label>
              <input {...register('stock')} type="number" className="input-field" placeholder="100" />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Product Images</label>
            
            {watchImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {watchImages.map((imgUrl, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] aspect-square flex items-center justify-center">
                    <img src={imgUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-danger"
                        onClick={() => {
                          const updated = watchImages.filter((_, i) => i !== index);
                          setValue('images', updated, { shouldValidate: true });
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl cursor-pointer bg-[var(--bg-primary)] transition-colors p-4">
              <div className="flex flex-col items-center text-center space-y-1">
                <span className="text-2xl">📸</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select Product Images</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Select one or multiple files</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  
                  const newImages: string[] = [];
                  for (const file of files) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error(`File "${file.name}" is too large (max 5MB)`);
                      continue;
                    }
                    try {
                      const base64 = await fileToBase64(file);
                      newImages.push(base64);
                    } catch (err) {
                      toast.error(`Failed to read file "${file.name}"`);
                    }
                  }
                  
                  setValue('images', [...watchImages, ...newImages], { shouldValidate: true });
                }}
              />
            </label>
            <input type="hidden" {...register('images')} />
            {errors.images && <p className="text-xs text-red-500 mt-1">{errors.images.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select {...register('status')} className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => { setDrawerOpen(false); setEditProduct(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {editProduct ? 'Update' : 'Create Product'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        open={!!deleteProduct}
        title="Delete Product"
        message={`Delete "${deleteProduct?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
        onCancel={() => setDeleteProduct(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
