import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { categoriesService, productsService } from '../../services/dataService';
import { Category, Product } from '../../types';
import { StatusBadge, Skeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Drawer from '../../components/modals/Drawer';

// Subcategory Zod Schema
const subcategorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().min(5, 'Description required'),
  image: z.string().optional(),
  urlKey: z.string().optional(),
  order: z.preprocess((val) => (val === '' || val === undefined ? 0 : Number(val)), z.number().int().nonnegative().default(0)),
  status: z.enum(['active', 'inactive']).default('active'),
});
type SubcategoryForm = z.infer<typeof subcategorySchema>;

// Product Zod Schema
const productSchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().min(5, 'Description required'),
  about: z.string().optional(),
  brand: z.string().optional(),
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

  // Selected subcategory state
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);

  // Search queries
  const [subcatSearchQuery, setSubcatSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Drawers and Edit States
  const [subcatDrawerOpen, setSubcatDrawerOpen] = useState(false);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  
  const [editSubcat, setEditSubcat] = useState<Category | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [deleteSubcat, setDeleteSubcat] = useState<Category | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Forms
  const subcatForm = useForm<SubcategoryForm>({ resolver: zodResolver(subcategorySchema) });
  const productForm = useForm<ProductForm>({ resolver: zodResolver(productSchema) });
  const watchProductImages = productForm.watch('images') || [];

  // Query: Level 1 Category
  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesService.getById(id!),
    enabled: !!id,
  });

  // Query: All categories for subcategory filtering
  const { data: allCategories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories', 'subcategories', id, subcatSearchQuery],
    queryFn: () => categoriesService.getAll({ name: subcatSearchQuery, level: 2, parentId: id }),
  });

  // Filter Subcategories (Level 2 categories belonging to this Level 1 category)
  const subcategories = (allCategories ?? []).filter(
    (c) => c.parentId === id && c.level === 2
  );

  // Automatically select first subcategory
  useEffect(() => {
    if (subcategories.length > 0 && !selectedSubcatId) {
      setSelectedSubcatId(subcategories[0].id);
    }
  }, [subcategories, selectedSubcatId]);

  // Query: Products under the selected Subcategory
  const { data: products, isLoading: prodsLoading } = useQuery({
    queryKey: ['products', selectedSubcatId, productSearchQuery],
    queryFn: () => productsService.getByCategoryId(selectedSubcatId!, productSearchQuery),
    enabled: !!selectedSubcatId,
  });

  const selectedSubcat = subcategories.find(sc => sc.id === selectedSubcatId);

  // Mutations: Subcategories
  const createSubcatMutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Subcategory created');
      setSubcatDrawerOpen(false);
      subcatForm.reset();
    },
  });

  const updateSubcatMutation = useMutation({
    mutationFn: ({ sid, data }: { sid: string; data: Partial<Category> }) => categoriesService.update(sid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Subcategory updated');
      setSubcatDrawerOpen(false);
      setEditSubcat(null);
      subcatForm.reset();
    },
  });

  const deleteSubcatMutation = useMutation({
    mutationFn: (sid: string) => categoriesService.delete(sid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Subcategory deleted');
      setDeleteSubcat(null);
      if (selectedSubcatId === deleteSubcat?.id) {
        setSelectedSubcatId(null);
      }
    },
  });

  const toggleSubcatStatusMutation = useMutation({
    mutationFn: ({ sid, status }: { sid: string; status: 'active' | 'inactive' }) => categoriesService.update(sid, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Subcategory status updated');
    },
  });

  // Mutations: Products
  const createProductMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productsService.create({ ...data, categoryId: selectedSubcatId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', selectedSubcatId] });
      toast.success('Product created');
      setProductDrawerOpen(false);
      productForm.reset();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ pid, data }: { pid: string; data: Partial<Product> }) => productsService.update(pid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', selectedSubcatId] });
      toast.success('Product updated');
      setProductDrawerOpen(false);
      setEditProduct(null);
      productForm.reset();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (pid: string) => productsService.delete(pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', selectedSubcatId] });
      toast.success('Product deleted');
      setDeleteProduct(null);
    },
  });

  const toggleProductStatusMutation = useMutation({
    mutationFn: ({ pid, status }: { pid: string; status: 'active' | 'inactive' }) => productsService.update(pid, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', selectedSubcatId] });
      toast.success('Product status updated');
    },
  });

  // Open Handlers
  const openCreateSubcat = () => {
    setEditSubcat(null);
    subcatForm.reset({
      name: '',
      description: '',
      image: '',
      urlKey: '',
      order: 0,
      status: 'active',
    });
    setSubcatDrawerOpen(true);
  };

  const openEditSubcat = (sc: Category) => {
    setEditSubcat(sc);
    subcatForm.reset({
      name: sc.name,
      description: sc.description,
      image: sc.image || '',
      urlKey: sc.urlKey || '',
      order: sc.order ?? 0,
      status: sc.status || 'active',
    });
    setSubcatDrawerOpen(true);
  };

  const openCreateProduct = () => {
    if (!selectedSubcatId) {
      toast.error('Please select a subcategory first');
      return;
    }
    setEditProduct(null);
    productForm.reset({
      name: '',
      description: '',
      about: '',
      brand: '',
      price: 0,
      discountPrice: undefined,
      stock: 0,
      order: 0,
      images: [],
      status: 'active',
    });
    setProductDrawerOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditProduct(p);
    productForm.reset({
      name: p.name,
      description: p.description,
      about: p.about || '',
      brand: p.brand || '',
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      order: p.order ?? 0,
      images: p.images || [],
      status: p.status || 'active',
    });
    setProductDrawerOpen(true);
  };

  // Submit Handlers
  const onSubcatSubmit = (data: SubcategoryForm) => {
    const payload = {
      ...data,
      parentId: id!,
      level: 2,
    };
    if (editSubcat) {
      updateSubcatMutation.mutate({ sid: editSubcat.id, data: payload });
    } else {
      createSubcatMutation.mutate(payload);
    }
  };

  const onProductSubmit = (data: ProductForm) => {
    const payload = {
      name: data.name,
      description: data.description,
      about: data.about || '',
      brand: data.brand || 'Generic',
      price: data.price,
      discountPrice: data.discountPrice,
      stock: data.stock,
      order: data.order ?? 0,
      images: data.images || [],
      status: data.status,
    };
    if (editProduct) {
      updateProductMutation.mutate({ pid: editProduct.id, data: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  if (catLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="card"><Skeleton className="h-40" /></div></div>;
  if (!category) return <div>Category not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/categories')}>← Back</button>
        <h1 className="page-title">Category Details</h1>
      </div>

      {/* Level 1 Category Info */}
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
              <div className="flex items-center gap-2">
                <span className="badge badge-purple">Level 1 Root</span>
                <StatusBadge status={category.status} />
              </div>
            </div>
            <div className="flex gap-4 mt-3">
              <div className="p-2 rounded-lg text-center bg-[var(--bg-tertiary)]" style={{ minWidth: 80 }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{subcategories.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Subcategories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Column Layout: Subcategories & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Subcategories (Level 2) */}
        <div className="lg:col-span-4 card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Subcategories</h3>
            <button className="btn btn-primary btn-sm px-2.5 py-1" onClick={openCreateSubcat}>+ Add</button>
          </div>

          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search subcategory..."
              value={subcatSearchQuery}
              onChange={(e) => setSubcatSearchQuery(e.target.value)}
              className="input-field pl-8 py-1.5 text-xs"
            />
          </div>

          {catsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : !subcategories.length ? (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">No subcategories found</div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {subcategories.map((subcat) => {
                const isSelected = subcat.id === selectedSubcatId;
                return (
                  <div
                    key={subcat.id}
                    onClick={() => { setSelectedSubcatId(subcat.id); setProductSearchQuery(''); }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                      isSelected 
                        ? 'border-[var(--accent)] bg-[rgba(99,102,241,0.06)] font-semibold' 
                        : 'border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          subcat.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} 
                      />
                      <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{subcat.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-ghost btn-sm p-1 rounded-lg text-xs" 
                        onClick={() => openEditSubcat(subcat)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm p-1 rounded-lg text-xs text-red-500" 
                        onClick={() => setDeleteSubcat(subcat)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Products under selected Subcategory */}
        <div className="lg:col-span-8 card space-y-4">
          {!selectedSubcatId ? (
            <EmptyState icon="🏷️" title="No subcategory selected" subtitle="Create or select a subcategory on the left to view products" />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Products in {selectedSubcat?.name || 'Subcategory'}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {products?.length ?? 0} items available
                  </p>
                </div>
                <button className="btn btn-primary btn-sm self-start sm:self-auto" onClick={openCreateProduct}>+ Add Product</button>
              </div>

              {/* Product Search Bar */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search products in this subcategory by name..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="input-field pl-9 py-2"
                />
              </div>

              {prodsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="card p-4 space-y-3">
                      <Skeleton className="h-32 rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : !products?.length ? (
                <EmptyState icon="🛍️" title="No products found" subtitle={productSearchQuery ? "Try searching for something else" : "Add your first product to this subcategory"} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      {product.images[0] && (
                        <div className="h-40 overflow-hidden relative">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{product.name}</h4>
                            <StatusBadge status={product.status} />
                          </div>
                          <p className="text-xs line-clamp-2 mt-1" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
                          
                          {product.about && (
                            <div className="mt-2 text-xs bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border)]">
                              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>About: </span>
                              <span className="line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{product.about}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2.5">
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

                          <div className="flex gap-1.5 mt-3 pt-1">
                            <button className="btn btn-secondary btn-sm flex-1 justify-center" onClick={() => openEditProduct(product)}>✏️ Edit</button>
                            <button 
                              className="btn btn-ghost btn-sm btn-icon border border-[var(--border)]" 
                              onClick={() => toggleProductStatusMutation.mutate({ pid: product.id, status: product.status === 'active' ? 'inactive' : 'active' })}
                            >
                              {product.status === 'active' ? '⏸️' : '▶️'}
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon text-red-500 border border-[var(--border)]" onClick={() => setDeleteProduct(product)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Subcategory Drawer (Level 2 Category) */}
      <Drawer open={subcatDrawerOpen} title={editSubcat ? 'Edit Subcategory' : 'Add Subcategory'} onClose={() => { setSubcatDrawerOpen(false); setEditSubcat(null); }}>
        <form onSubmit={subcatForm.handleSubmit(onSubcatSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subcategory Name *</label>
            <input {...subcatForm.register('name')} className="input-field" placeholder="e.g. Cordless Drills" />
            {subcatForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{subcatForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea {...subcatForm.register('description')} rows={3} className="input-field resize-none" placeholder="Subcategory description..." />
            {subcatForm.formState.errors.description && <p className="text-xs text-red-500 mt-1">{subcatForm.formState.errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL Key</label>
            <input {...subcatForm.register('urlKey')} className="input-field" placeholder="e.g. cordless-drills" />
            {subcatForm.formState.errors.urlKey && <p className="text-xs text-red-500 mt-1">{subcatForm.formState.errors.urlKey.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subcategory Image</label>
            {subcatForm.watch('image') ? (
              <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] h-40 flex items-center justify-center">
                <img src={subcatForm.watch('image')} alt="Preview" className="max-w-full max-h-full object-contain" />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => subcatForm.setValue('image', '', { shouldValidate: true })}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl cursor-pointer bg-[var(--bg-primary)] transition-colors p-4">
                <div className="flex flex-col items-center text-center space-y-1.5">
                  <span className="text-3xl">📤</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select Subcategory Image</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PNG, JPG or GIF (max 5MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File is too large (max 5MB)');
                        return;
                      }
                      try {
                        const base64 = await fileToBase64(file);
                        subcatForm.setValue('image', base64, { shouldValidate: true });
                      } catch (err) {
                        toast.error('Failed to read file');
                      }
                    }
                  }}
                />
              </label>
            )}
            <input type="hidden" {...subcatForm.register('image')} />
            {subcatForm.formState.errors.image && <p className="text-xs text-red-500 mt-1">{subcatForm.formState.errors.image.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display Order</label>
            <input {...subcatForm.register('order')} type="number" className="input-field" placeholder="0" />
            {subcatForm.formState.errors.order && <p className="text-xs text-red-500 mt-1">{subcatForm.formState.errors.order.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select {...subcatForm.register('status')} className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {subcatForm.formState.errors.status && <p className="text-xs text-red-500 mt-1">{subcatForm.formState.errors.status.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => { setSubcatDrawerOpen(false); setEditSubcat(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={createSubcatMutation.isPending || updateSubcatMutation.isPending}>
              {createSubcatMutation.isPending || updateSubcatMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                  </svg>
                  Saving...
                </span>
              ) : editSubcat ? 'Update Subcategory' : 'Create Subcategory'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Product Drawer */}
      <Drawer open={productDrawerOpen} title={editProduct ? 'Edit Product' : 'Add Product'} onClose={() => { setProductDrawerOpen(false); setEditProduct(null); }}>
        <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Product Name *</label>
            <input {...productForm.register('name')} className="input-field" placeholder="e.g. Makita Cordless Drill" />
            {productForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Short Description *</label>
            <textarea {...productForm.register('description')} rows={2} className="input-field resize-none" placeholder="Brief tagline..." />
            {productForm.formState.errors.description && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>About (Detailed Info)</label>
            <textarea {...productForm.register('about')} rows={4} className="input-field resize-none" placeholder="Detailed product specifications, box content, warranty details..." />
            {productForm.formState.errors.about && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.about.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Brand</label>
              <input {...productForm.register('brand')} className="input-field" placeholder="e.g. Bosch" />
              {productForm.formState.errors.brand && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.brand.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display Order</label>
              <input {...productForm.register('order')} type="number" className="input-field" placeholder="0" />
              {productForm.formState.errors.order && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.order.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>MRP (₹) *</label>
              <input {...productForm.register('price')} type="number" className="input-field" placeholder="2000" />
              {productForm.formState.errors.price && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Selling Price (₹)</label>
              <input {...productForm.register('discountPrice')} type="number" className="input-field" placeholder="1500" />
              {productForm.formState.errors.discountPrice && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.discountPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stock Qty *</label>
              <input {...productForm.register('stock')} type="number" className="input-field" placeholder="100" />
              {productForm.formState.errors.stock && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.stock.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Product Images</label>
            
            {watchProductImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {watchProductImages.map((imgUrl, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] aspect-square flex items-center justify-center">
                    <img src={imgUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-danger"
                        onClick={() => {
                          const updated = watchProductImages.filter((_, i) => i !== index);
                          productForm.setValue('images', updated, { shouldValidate: true });
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
                  
                  productForm.setValue('images', [...watchProductImages, ...newImages], { shouldValidate: true });
                }}
              />
            </label>
            <input type="hidden" {...productForm.register('images')} />
            {productForm.formState.errors.images && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.images.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select {...productForm.register('status')} className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {productForm.formState.errors.status && <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.status.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => { setProductDrawerOpen(false); setEditProduct(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
              {createProductMutation.isPending || updateProductMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                  </svg>
                  Saving...
                </span>
              ) : editProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Delete Subcategory Confirm Modal */}
      <ConfirmModal
        open={!!deleteSubcat}
        title="Delete Subcategory"
        message={`Delete subcategory "${deleteSubcat?.name}"? All products under it will be unlinked.`}
        confirmLabel="Delete"
        onConfirm={() => deleteSubcat && deleteSubcatMutation.mutate(deleteSubcat.id)}
        onCancel={() => setDeleteSubcat(null)}
        isLoading={deleteSubcatMutation.isPending}
      />

      {/* Delete Product Confirm Modal */}
      <ConfirmModal
        open={!!deleteProduct}
        title="Delete Product"
        message={`Delete "${deleteProduct?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() => deleteProduct && deleteProductMutation.mutate(deleteProduct.id)}
        onCancel={() => setDeleteProduct(null)}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
