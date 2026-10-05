"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getPersonByAuthUserId, StewardOption } from "@/utils/steward-actions";

// 1.0.1 AT3: links an inspection to the profile of the person who submitted it.
// Shows nothing for old reports with no user, or if the lookup fails.
export default function SubmittedBy({ userId }: { userId: string | null }) {
  const [person, setPerson] = useState<StewardOption | null>(null);

  useEffect(() => {
    if (!userId) return;
    getPersonByAuthUserId(userId).then(setPerson).catch(() => setPerson(null));
  }, [userId]);

  if (!person) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-[#7A8075] mb-1">Submitted by</p>
      <Link href={`/people/${person.id}`} className="font-semibold text-[#356B43] underline" data-testid="inspection-submitter-link">
        {person.displayName}
      </Link>
    </div>
  );
}
