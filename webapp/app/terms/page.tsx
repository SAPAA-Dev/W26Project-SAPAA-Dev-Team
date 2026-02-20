import { Suspense } from "react";
import TermsContent from "./TermsContent";

export default function TermsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TermsContent />
    </Suspense>
  );
}
