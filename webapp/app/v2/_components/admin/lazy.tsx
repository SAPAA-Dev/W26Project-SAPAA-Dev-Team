'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps, ComponentType } from 'react';
import { api } from '@/lib/api/v1/client';
import { useApi } from '@/app/v2/_lib/useApi';

/**
 * The admin tools are a large share of the app's code and every one of them renders nothing for a steward.
 * These wrappers check the role first, so stewards (most users, on the slowest phones) never download them;
 * an admin gets the chunk once /me says so.
 */
function adminOnly<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  const Lazy = dynamic(load);
  return function AdminOnly(props: P) {
    const isAdmin = useApi('me', api.me).data?.role === 'admin';
    return isAdmin ? <Lazy {...props} /> : null;
  };
}

export const AdminSitesBar = adminOnly(() => import('./AdminSitesBar'));
export const KmlImportSheet = adminOnly(() => import('./KmlImportSheet'));
export const AdminSiteTools = adminOnly(() => import('./AdminSiteTools'));
export const AdminReportActions = adminOnly(() => import('./AdminReportActions'));
export const AdminArchivedReports = adminOnly(() => import('./AdminArchivedReports'));
const PhotoActions = dynamic(() => import('./AdminPhotoActions'));
export function AdminPhotoActions(props: ComponentProps<typeof PhotoActions>) {
  const isAdmin = useApi('me', api.me).data?.role === 'admin';
  return props.photo.canEdit || isAdmin ? <PhotoActions {...props} /> : null;
}
export const AdminSettingsLinks = adminOnly(() => import('./AdminSettingsLinks'));
