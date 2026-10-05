'use client';

import ProfilePage from '@/components/ProfilePage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { use } from 'react';

export default function PersonProfilePage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = use(params);
  return <ProtectedRoute><ProfilePage personId={personId} /></ProtectedRoute>;
}
