import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { legalService } from '../../services/dataService';
import { LegalDocument } from '../../types';
import { StatusBadge } from '../../components/ui';
import Drawer from '../../components/modals/Drawer';

const legalSchema = z.object({
  title: z.string().min(2, 'Title is required (min 2 chars)'),
  content: z.string().min(10, 'Content is required (min 10 chars)'),
  version: z.string().min(1, 'Version is required').regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (e.g. 1.0.0)'),
  isActive: z.boolean().default(true),
});

type LegalForm = z.infer<typeof legalSchema>;

type LegalTab = 'TERMS_AND_CONDITIONS' | 'PRIVACY_POLICY' | 'ABOUT_US';

const tabsConfig: Record<LegalTab, { label: string; icon: string; subtitle: string }> = {
  TERMS_AND_CONDITIONS: {
    label: 'Terms & Conditions',
    icon: '📝',
    subtitle: 'Manage client usage agreements and legal parameters.',
  },
  PRIVACY_POLICY: {
    label: 'Privacy Policy',
    icon: '🔒',
    subtitle: 'Manage data protection guidelines and privacy agreements.',
  },
  ABOUT_US: {
    label: 'About Us',
    icon: 'ℹ️',
    subtitle: 'Manage company profile, mission statement and values.',
  },
};

export default function LegalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LegalTab>('TERMS_AND_CONDITIONS');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fetch the active legal document
  const { data: documentData, isLoading, isError } = useQuery<LegalDocument | null>({
    queryKey: ['legal', activeTab],
    queryFn: () => legalService.getByType(activeTab),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LegalForm>({
    resolver: zodResolver(legalSchema),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: Partial<LegalDocument>) => legalService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal', activeTab] });
      toast.success(`${tabsConfig[activeTab].label} created successfully`);
      setDrawerOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create document');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LegalDocument> }) =>
      legalService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal', activeTab] });
      toast.success(`${tabsConfig[activeTab].label} updated successfully`);
      setDrawerOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update document');
    },
  });

  const openDrawer = () => {
    if (documentData) {
      reset({
        title: documentData.title,
        content: documentData.content,
        version: documentData.version,
        isActive: documentData.isActive,
      });
    } else {
      reset({
        title: tabsConfig[activeTab].label,
        content: '',
        version: '1.0.0',
        isActive: true,
      });
    }
    setIsPreviewMode(false);
    setDrawerOpen(true);
  };

  const onSubmit = (data: LegalForm) => {
    const payload: Partial<LegalDocument> = {
      ...data,
      type: activeTab,
    };

    if (documentData?.id) {
      updateMutation.mutate({ id: documentData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const currentContent = watch('content') || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Legal & Content</h1>
          <p className="page-subtitle">Configure application policies, terms, and informational content</p>
        </div>
        <button className="btn btn-primary" onClick={openDrawer}>
          {documentData ? '✏️ Edit Content' : '➕ Create Content'}
        </button>
      </div>

      {/* Modern Tabs */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left tabs selector */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-2 p-2 rounded-2xl border bg-[var(--bg-secondary)] border-[var(--border)] h-fit">
          {(Object.keys(tabsConfig) as LegalTab[]).map((tabKey) => {
            const config = tabsConfig[tabKey];
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                }}
                className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'shadow-md border border-[var(--border)] bg-[var(--bg-tertiary)]'
                    : 'hover:bg-[var(--bg-primary)] border border-transparent'
                }`}
              >
                <span className="text-2xl mt-0.5">{config.icon}</span>
                <div>
                  <div
                    className="font-semibold text-sm transition-colors duration-150"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}
                  >
                    {config.label}
                  </div>
                  <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {config.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right details content view */}
        <div className="flex-1">
          {isLoading ? (
            <div className="card space-y-4">
              <div className="h-6 bg-[var(--border)] rounded animate-pulse w-1/4"></div>
              <div className="h-4 bg-[var(--border)] rounded animate-pulse w-1/3"></div>
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-[var(--border)] rounded animate-pulse w-full"></div>
                <div className="h-3 bg-[var(--border)] rounded animate-pulse w-full"></div>
                <div className="h-3 bg-[var(--border)] rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ) : isError ? (
            <div className="card text-center p-8">
              <span className="text-4xl">⚠️</span>
              <h3 className="font-semibold text-base mt-2" style={{ color: 'var(--text-primary)' }}>
                Error Loading Content
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Please check your network or backend API connection.
              </p>
            </div>
          ) : !documentData ? (
            <div className="card text-center py-16 flex flex-col items-center justify-center gap-4">
              <span className="text-5xl">{tabsConfig[activeTab].icon}</span>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  No {tabsConfig[activeTab].label} document found
                </h3>
                <p className="text-sm max-w-md mx-auto mt-1" style={{ color: 'var(--text-secondary)' }}>
                  There is currently no published version of this document. Create a new revision to make it active.
                </p>
              </div>
              <button className="btn btn-primary mt-2" onClick={openDrawer}>
                ➕ Create {tabsConfig[activeTab].label}
              </button>
            </div>
          ) : (
            <div className="card space-y-5">
              {/* Document Info Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {documentData.title}
                    </h2>
                    <StatusBadge status={documentData.isActive ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span>
                      Version: <strong className="text-[var(--text-primary)]">{documentData.version}</strong>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]"></span>
                    <span>
                      Updated: {new Date(documentData.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {documentData.id && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]"></span>
                        <span className="font-mono text-[10px]">ID: {documentData.id}</span>
                      </>
                    )}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={openDrawer}>
                  ✏️ Edit Document
                </button>
              </div>

              {/* Document Text Body */}
              <div className="rounded-xl p-5 md:p-6 bg-[var(--bg-primary)] border border-[var(--border)]">
                <div
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {documentData.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Drawer */}
      <Drawer
        open={drawerOpen}
        title={documentData ? `Edit ${tabsConfig[activeTab].label}` : `Create ${tabsConfig[activeTab].label}`}
        onClose={() => setDrawerOpen(false)}
        width="650px"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Document Title *
            </label>
            <input
              {...register('title')}
              className="input-field"
              placeholder="e.g. Terms and Conditions"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Version *
              </label>
              <input
                {...register('version')}
                className="input-field font-mono"
                placeholder="e.g. 1.0.0"
              />
              {errors.version && <p className="text-xs text-red-500 mt-1">{errors.version.message}</p>}
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Status
              </label>
              <select
                {...register('isActive', { setValueAs: (v) => v === 'true' || v === true })}
                className="input-field"
              >
                <option value="true">Active / Published</option>
                <option value="false">Draft / Hidden</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Content *
              </label>
              <div className="flex gap-1 p-0.5 rounded-lg border bg-[var(--bg-primary)] border-[var(--border)] text-xs">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    !isPreviewMode ? 'bg-[var(--bg-secondary)] shadow-sm' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    isPreviewMode ? 'bg-[var(--bg-secondary)] shadow-sm' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {isPreviewMode ? (
              <div className="rounded-xl p-4 bg-[var(--bg-primary)] border border-[var(--border)] min-h-[300px] max-h-[450px] overflow-y-auto">
                {currentContent ? (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed font-sans text-[var(--text-secondary)]">
                    {currentContent}
                  </div>
                ) : (
                  <p className="text-xs italic text-[var(--text-muted)] text-center pt-20">Nothing to preview yet.</p>
                )}
              </div>
            ) : (
              <textarea
                {...register('content')}
                rows={12}
                className="input-field font-sans resize-none text-sm leading-relaxed"
                placeholder="Enter document text content here..."
              />
            )}
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
          </div>

          <div className="flex gap-3 pt-3 border-t border-[var(--border)] mt-6">
            <button
              type="button"
              className="btn btn-secondary flex-1 justify-center"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 justify-center"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                  </svg>
                  Saving...
                </span>
              ) : documentData ? (
                'Update Document'
              ) : (
                'Create Document'
              )}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
