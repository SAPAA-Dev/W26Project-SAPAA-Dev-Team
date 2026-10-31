'use client';

import UploadImages from '@/components/UploadImages';
import { invalidate } from '@/app/v2/_lib/useApi';

export function AddPhotosSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <UploadImages open={open} onClose={onClose} onUploaded={() => {
    invalidate('photos');
    invalidate('site-photos:');
  }} />;
}
