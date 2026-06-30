import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { categoriesService } from '../../services/dataService';
import { Category } from '../../types';
import { StatusBadge, CardSkeleton, EmptyState } from '../../components/ui';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Drawer from '../../components/modals/Drawer';
import { format } from 'date-fns';

const categorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().min(5, 'Description required'),
  image: z.string().optional(),
  urlKey: z.string().optional(),
  banner: z.string().optional(),
  parentId: z.string().nullable().optional(),
  level: z.preprocess((val) => (val === '' || val === undefined ? 0 : Number(val)), z.number().int().nonnegative().default(0)),
  order: z.preprocess((val) => (val === '' || val === undefined ? 0 : Number(val)), z.number().int().nonnegative().default(0)),
  status: z.enum(['active', 'inactive']).default('active'),
});
type CategoryForm = z.infer<typeof categorySchema>;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.getAll });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });

  const createMutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); setDrawerOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoriesService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated'); setEditCat(null); setDrawerOpen(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); setDeleteCat(null); },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => categoriesService.update(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Status updated'); },
  });

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    reset({
      name: cat.name,
      description: cat.description,
      image: cat.image || '',
      urlKey: cat.urlKey || '',
      banner: cat.banner || '',
      parentId: cat.parentId || '',
      level: cat.level ?? 0,
      order: cat.order ?? 0,
      status: cat.status || 'active',
    });
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditCat(null);
    reset({
      name: '',
      description: '',
      image: '',
      urlKey: '',
      banner: '',
      parentId: '',
      level: 0,
      order: 0,
      status: 'active',
    });
    setDrawerOpen(true);
  };

  const onSubmit = (data: CategoryForm) => {
    const payload = {
      ...data,
      parentId: data.parentId === '' ? null : data.parentId,
    };
    if (editCat) updateMutation.mutate({ id: editCat.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories?.length ?? 0} categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Category</button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !categories?.length ? (
        <EmptyState icon="🏷️" title="No categories yet" subtitle="Create your first category" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="card hover:shadow-md cursor-pointer group overflow-hidden p-0" onClick={() => navigate(`/categories/${cat.id}`)}>
              {cat.image && (
                <div className="h-40 overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                  <StatusBadge status={cat.status} />
                </div>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {cat.productCount} products
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => openEdit(cat)}>✏️</button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title={cat.status === 'active' ? 'Deactivate' : 'Activate'}
                      onClick={() => toggleStatusMutation.mutate({ id: cat.id, status: cat.status === 'active' ? 'inactive' : 'active' })}
                    >
                      {cat.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon text-red-500" title="Delete" onClick={() => setDeleteCat(cat)}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <Drawer open={drawerOpen} title={editCat ? 'Edit Category' : 'Add Category'} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category Name *</label>
            <input {...register('name')} className="input-field" placeholder="e.g. Electronics" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Category description..." />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL Key</label>
            <input {...register('urlKey')} className="input-field" placeholder="e.g. power-tools" />
            {errors.urlKey && <p className="text-xs text-red-500 mt-1">{errors.urlKey.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Banner HTML/Text</label>
            <textarea {...register('banner')} rows={2} className="input-field resize-none" placeholder="Banner text or HTML..." />
            {errors.banner && <p className="text-xs text-red-500 mt-1">{errors.banner.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category Image</label>
            {watch('image') ? (
              <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] h-40 flex items-center justify-center">
                <img src={watch('image')} alt="Preview" className="max-w-full max-h-full object-contain" />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => setValue('image', '', { shouldValidate: true })}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl cursor-pointer bg-[var(--bg-primary)] transition-colors p-4">
                <div className="flex flex-col items-center text-center space-y-1.5">
                  <span className="text-3xl">📤</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select Category Image</span>
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
                        setValue('image', base64, { shouldValidate: true });
                      } catch (err) {
                        toast.error('Failed to read file');
                      }
                    }
                  }}
                />
              </label>
            )}
            <input type="hidden" {...register('image')} />
            {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Parent Category</label>
            <select {...register('parentId')} className="input-field">
              <option value="">None (Root Category)</option>
              {(categories?.filter(c => c.id !== editCat?.id) ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.parentId && <p className="text-xs text-red-500 mt-1">{errors.parentId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Level</label>
              <input {...register('level')} type="number" className="input-field" placeholder="0" />
              {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display Order</label>
              <input {...register('order')} type="number" className="input-field" placeholder="0" />
              {errors.order && <p className="text-xs text-red-500 mt-1">{errors.order.message}</p>}
            </div>
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
            <button type="button" className="btn btn-secondary flex-1" onClick={() => setDrawerOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
              {editCat ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        open={!!deleteCat}
        title="Delete Category"
        message={`Delete "${deleteCat?.name}"? All products will be unlinked.`}
        confirmLabel="Delete"
        onConfirm={() => deleteCat && deleteMutation.mutate(deleteCat.id)}
        onCancel={() => setDeleteCat(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
