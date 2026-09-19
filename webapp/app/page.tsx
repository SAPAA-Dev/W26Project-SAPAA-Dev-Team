'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);

  // Show a simple loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4EBE4] via-[#F7F2EA] to-[#E4EBE4] flex items-center justify-center">
      <div className="text-center">
        <Image 
          src="/images/sapaa-logo-vertical.png" 
          alt="SAPAA"
          width={250}
          height={250}
          priority
          className="h-auto w-64 mx-auto mb-6"
        />
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#7A8075] font-medium">Redirecting to login...</p>
      </div>
    </div>
  );
}