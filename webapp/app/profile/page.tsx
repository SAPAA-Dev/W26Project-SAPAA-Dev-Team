'use client';

import ProfilePage from '@/components/ProfilePage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyProfilePage() {
  return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
}
