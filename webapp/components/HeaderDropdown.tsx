// "use client";


// import { usePathname } from "next/navigation";
// import { Home, Menu, X } from "lucide-react";

// import React, { useState, Suspense } from 'react';
// import { useRouter } from 'next/navigation';
// import Image from 'next/image';
// import {
//   Home,
//   MapPin,
//   ClipboardList,
//   TrendingUp,
//   Mail,
//   LogOut,
//   Menu,
//   X,
// } from 'lucide-react';
// import { SubmissionToast } from './SubmissionToast';
// import { logout } from '@/services/auth';

// export default function UserNavBar() {
//   const pathname = usePathname();
//   const [menuOpen, setMenuOpen] = useState(false);

//   const navItems = [
//     { name: "Sites", href: "/sites" },
//     { name: "Image Gallery", href: "/gallery" },
//     { name: "Logout", href: "/logout", danger: true},
//   ];

//   return (
//     <div id="tutorial-header" className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
//   <Suspense fallback={null}>
//     <SubmissionToast />
//   </Suspense>
 
//   <div className="max-w-7xl mx-auto flex items-center justify-between">
//     {/* Logo + title */}
//     <div className="flex items-center gap-4">
//       <Image
//         src="/images/sapaa-icon-white.png"
//         alt="SAPAA"
//         width={140}
//         height={140}
//         priority
//         className="h-16 w-auto flex-shrink-0 opacity-100 mt-1"
//       />
//       <div>
//         <h1 className="text-3xl font-bold mt-3">Protected Areas</h1>
//         <p className="text-[#E4EBE4] text-base mt-0.5">
//           Monitor and track site inspections across Alberta
//         </p>
//       </div>
//     </div>
 
//     {/* Single unified menu */}
//     <div className="relative mt-4">
//       <button
//         onClick={() => setMenuOpen(!menuOpen)}
//         title="Open menu"
//         className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center gap-[5px] transition-all
//           ${menuOpen
//             ? 'bg-white/15 border-white/40'
//             : 'bg-transparent border-white/25 hover:bg-white/10'
//           }`}
//       >
//         {/* Animated hamburger → X */}
//         <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-200
//           ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`}
//         />
//         <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-200
//           ${menuOpen ? 'opacity-0' : ''}`}
//         />
//         <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-200
//           ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`}
//         />
//       </button>
 
//       {menuOpen && (
//         <>
//           {/* Backdrop — closes menu on outside click */}
//           <div
//             className="fixed inset-0 z-40"
//             onClick={() => setMenuOpen(false)}
//           />
 
//           <div className="absolute right-0 top-[calc(100%+8px)] w-60 bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden z-50">
 
//             {/* Admin section — only for admins */}
//             {currentUser?.role === 'admin' && (
//               <div className="py-1.5 border-b border-black/[0.07]">
//                 <p className="text-[10.5px] font-semibold uppercase tracking-widest text-black/30 px-4 pt-2 pb-1">
//                   Admin
//                 </p>
//                 <button
//                   onClick={() => { setMenuOpen(false); router.push('/admin/dashboard'); }}
//                   className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
//                 >
//                   <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
//                     <Home className="w-4 h-4 text-[#555]" />
//                   </span>
//                   <span className="text-sm font-medium text-[#1a1a1a]">Dashboard</span>
//                 </button>
//                 <button
//                   onClick={() => { setMenuOpen(false); router.push('/sites'); }}
//                   className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
//                 >
//                   <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
//                     <MapPin className="w-4 h-4 text-[#555]" />
//                   </span>
//                   <span className="text-sm font-medium text-[#1a1a1a]">Sites</span>
//                 </button>
//                 <button
//                   onClick={() => { setMenuOpen(false); router.push('/gallery'); }}
//                   className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
//                 >
//                   <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
//                     <ClipboardList className="w-4 h-4 text-[#555]" />
//                   </span>
//                   <span className="text-sm font-medium text-[#1a1a1a]">Image gallery</span>
//                 </button>
//               </div>
//             )}
 
//             {/* Help section */}
//             <div className="py-1.5 border-b border-black/[0.07]">
//               <p className="text-[10.5px] font-semibold uppercase tracking-widest text-black/30 px-4 pt-2 pb-1">
//                 Help
//               </p>
//               <button
//                 onClick={() => { setMenuOpen(false); handleStartTutorial(); }}
//                 className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
//               >
//                 <span className="w-8 h-8 rounded-lg bg-[#eef4fb] flex items-center justify-center flex-shrink-0">
//                   <TrendingUp className="w-4 h-4 text-[#2a6db5]" />
//                 </span>
//                 <div className="text-left">
//                   <p className="text-sm font-medium text-[#1a1a1a]">App tutorial</p>
//                   <p className="text-xs text-black/40">Replay the walkthrough</p>
//                 </div>
//               </button>
//               <a
//                 href="mailto:support@example.com"
//                 onClick={() => setMenuOpen(false)}
//                 className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
//               >
//                 <span className="w-8 h-8 rounded-lg bg-[#eef4fb] flex items-center justify-center flex-shrink-0">
//                   <Search className="w-4 h-4 text-[#2a6db5]" />
//                 </span>
//                 <div className="text-left">
//                   <p className="text-sm font-medium text-[#1a1a1a]">Contact us</p>
//                   <p className="text-xs text-black/40">Send us a message</p>
//                 </div>
//               </a>
//             </div>
 
//             {/* Logout */}
//             <div className="py-1.5">
//               <button
//                 onClick={async () => {
//                   setMenuOpen(false);
//                   await logout();
//                   window.location.href = '/login';
//                 }}
//                 className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#fdf0f0] transition-colors"
//               >
//                 <span className="w-8 h-8 rounded-lg bg-[#fdf0f0] flex items-center justify-center flex-shrink-0">
//                   <AlertCircle className="w-4 h-4 text-[#c0392b]" />
//                 </span>
//                 <span className="text-sm font-medium text-[#c0392b]">Logout</span>
//               </button>
//             </div>
 
//           </div>
//         </>
//       )}
//     </div>
//   </div>
// </div>
    
//   );
// }

