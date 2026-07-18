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

const categorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().min(5, 'Description required'),
  image: z.string().optional(),
  urlKey: z.string().optional(),
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
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', 'list', searchQuery],
    queryFn: () => categoriesService.getAll({ name: searchQuery, level: 1 }),
  });

  // Filter for Level 1 categories
  const level1Categories = (categories ?? []).filter(
    (c) => c.level === 1 || !c.parentId
  );

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Status updated'); },
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => categoriesService.update(id, { status }),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: categoriesService.bulkUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categories bulk uploaded successfully');
      setBulkDrawerOpen(false);
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Bulk upload failed');
    },
  });

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    reset({
      name: cat.name,
      description: cat.description,
      image: cat.image || '',
      urlKey: cat.urlKey || '',
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
      order: 0,
      status: 'active',
    });
    setDrawerOpen(true);
  };

  const onSubmit = (data: CategoryForm) => {
    const payload = {
      ...data,
      parentId: null,
      level: 1,
    };
    if (editCat) updateMutation.mutate({ id: editCat.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{level1Categories.length} root categories</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setBulkDrawerOpen(true)}>📤 Bulk Upload</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Category</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)]">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !level1Categories.length ? (
        <EmptyState icon="🏷️" title="No categories found" subtitle={searchQuery ? "Try a different search query" : "Create your first category"} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {level1Categories.map((cat) => (
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
                    {cat.productCount} subcategories/products
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => openEdit(cat)}>✏️</button>
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
            <input {...register('name')} className="input-field" placeholder="e.g. Power Tools" />
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
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Display Order</label>
            <input {...register('order')} type="number" className="input-field" placeholder="0" />
            {errors.order && <p className="text-xs text-red-500 mt-1">{errors.order.message}</p>}
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
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                  </svg>
                  Saving...
                </span>
              ) : editCat ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        open={!!deleteCat}
        title="Delete Category"
        message={`Delete "${deleteCat?.name}"? All subcategories and products will be unlinked.`}
        confirmLabel="Delete"
        onConfirm={() => deleteCat && deleteMutation.mutate(deleteCat.id)}
        onCancel={() => setDeleteCat(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Upload Drawer */}
      <Drawer
        open={bulkDrawerOpen}
        title="Bulk Upload Categories"
        onClose={() => {
          if (!bulkUploadMutation.isPending) {
            setBulkDrawerOpen(false);
            setSelectedFile(null);
          }
        }}
      >
        <div className="space-y-5">
          <div className="bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.15)] rounded-2xl p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Instructions:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--text-secondary)]">
              <li>Upload a CSV file containing your categories data.</li>
              <li>The file extension must be <strong>.csv</strong>.</li>
              <li>Make sure fields match the category schema.</li>
            </ul>
          </div>

          {selectedFile ? (
            <div className="card p-4 border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl flex-shrink-0">📄</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon text-red-500"
                disabled={bulkUploadMutation.isPending}
                onClick={() => setSelectedFile(null)}
              >
                🗑️
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl cursor-pointer bg-[var(--bg-primary)] transition-colors p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <span className="text-4xl">📤</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select CSV File</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Click or drag to select a CSV file (max 10MB)</span>
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.name.toLowerCase().endsWith('.csv')) {
                      toast.error('Only CSV files are allowed');
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size exceeds 10MB limit');
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
              />
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              disabled={bulkUploadMutation.isPending}
              onClick={() => {
                setBulkDrawerOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1 justify-center"
              disabled={!selectedFile || bulkUploadMutation.isPending}
              onClick={() => {
                if (selectedFile) {
                  bulkUploadMutation.mutate(selectedFile);
                }
              }}
            >
              {bulkUploadMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                  </svg>
                  Uploading...
                </span>
              ) : 'Upload File'}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
