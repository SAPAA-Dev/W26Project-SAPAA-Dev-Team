"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");


  return (
    <div className="min-h-screen bg-[#F7F2EA] flex flex-col">
      
      <header className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Terms & Conditions</h1>
            <p className="text-[#E4EBE4] text-sm">
              SAPAA Site Inspection Reports
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          
          <div className="p-6 border-b border-[#E4EBE4] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F7F2EA] rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#356B43]" />
            </div>
            <h2 className="text-xl font-bold text-[#254431]">
              Usage Agreement
            </h2>
          </div>

            <div className="p-6 space-y-10 text-[#7A8075] leading-relaxed text-sm sm:text-base">
            <section className="space-y-2">
                <h3 className="text-lg font-bold text-[#254431]">
                1. Accuracy of Information
                </h3>
                <p>
                By submitting a Site Inspection Report, you confirm thatBy submitting a Site Inspection Report, 
                you confirm that you have read through the terms and conditions, and understand SAPAA is not liable for the safety
                of non-SAPAA members. Please do consider joining SAPAA if you passionate about Alberta’s Protected/Natural Areas.

                </p>
            </section>
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#254431]">
                2. Important Emergency & Safety Information
                </h3>

                <p>
                This reporting system is <strong>not</strong> intended for emergencies.
                If you encounter any of the situations below, please use the appropriate
                contact instead:
                </p>

                <ul className="list-disc pl-6 space-y-3">
                <li>
                    <strong>Emergency situations:</strong> Call <strong>911</strong> or
                    contact your local RCMP or police detachment.
                </li>
                <li>
                    <strong>Significant damage or disturbances on public land:</strong>{" "}
                    Report illegal activity or public safety issues by calling{" "}
                    <a
                    href="https://www.alberta.ca/report-illegal-activity-call-310-land"
                    target="_blank"
                    className="underline text-[#356B43]"
                    >
                    310-LAND
                    </a>.
                </li>
                <li>
                    <strong>Poaching or wildlife concerns:</strong>{" "}
                    Report suspicious or illegal hunting, fishing, or dangerous wildlife
                    encounters{" "}
                    <a
                    href="https://www.alberta.ca/report-poacher"
                    target="_blank"
                    className="underline text-[#356B43]"
                    >
                    online
                    </a>{" "}
                    or by phone at <strong>1-800-642-3800</strong>.
                </li>
                </ul>
            </section>
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#254431]">
                3. Volunteering, Privacy, and Your Data
                </h3>

                <p>
                In Alberta, volunteers fall under the Occupational Health and Safety Act
                as unpaid employees. Please read the following carefully:
                </p>

                <ol className="list-decimal pl-6 space-y-3">
                <li>
                    <strong>You are not a SAPAA volunteer.</strong> SAPAA is not asking you
                    to conduct inspections of protected areas.
                </li>
                <li>
                    <strong>Submitting a report is optional.</strong> If you independently
                    visited a protected area, you may choose to document your visit.
                </li>
                <li>
                    <strong>Your privacy matters.</strong> Personal information you share
                    with SAPAA (such as name, email, and phone number) is protected and not
                    resold.
                </li>
                <li>
                    <strong>Government of Alberta access:</strong> Relevant government
                    departments may receive the report, including your name and contact
                    details. Once shared, the Government of Alberta is responsible for
                    protecting that data.
                </li>
                <li>
                    <strong>Limited SAPAA member access:</strong> Select SAPAA members may
                    view reports under strict privacy agreements.
                </li>
                <li>
                    <strong>Optional tools:</strong> You may use{" "}
                    <a
                    href="https://www.inaturalist.org/"
                    target="_blank"
                    className="underline text-[#356B43]"
                    >
                    iNaturalist.ca
                    </a>{" "}
                    to document plants and wildlife. It is free and widely used.
                    Future support for{" "}
                    <a
                    href="https://ebird.org/home"
                    target="_blank"
                    className="underline text-[#356B43]"
                    >
                    eBird.ca
                    </a>{" "}
                    may be added in 2026 or 2027.
                </li>
                </ol>

                <div className="bg-[#F7F2EA] p-4 rounded-xl space-y-2">
                <p className="font-semibold text-[#254431]">
                    Administrative Notes
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>
                    <strong>Revisions:</strong> You will receive a copy of your submission.
                    If changes are needed, contact{" "}
                    <a
                        href="mailto:webmaster@sapaastewards.com"
                        className="underline text-[#356B43]"
                    >
                        webmaster@sapaastewards.com
                    </a>.
                    </li>
                    <li>
                    <strong>Multiple visits:</strong> Submit a separate report for each
                    site visit.
                    </li>
                    <li>
                    <strong>Editorial control:</strong> SAPAA reserves editorial control
                    over published reporting.
                    </li>
                </ul>
                </div>
            </section>
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#254431]">
                4. Types of Contributors
                </h3>

                <ol className="list-decimal pl-6 space-y-3">
                <li>
                    <strong>Casual Visitor:</strong> You noticed something and wish to report
                    it. Use the <em>Simple Site Inspection Form</em>.
                </li>
                <li>
                    <strong>Organizations:</strong> Groups caring for a specific site may
                    use these forms if no other reporting system exists.
                </li>
                <li>
                    <strong>Full Contributor:</strong> Individuals with relevant expertise
                    may submit full inspection reports.
                </li>
                </ol>
            </section>
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#254431]">
                5. Photograph & File Naming Guidelines
                </h3>

                <p>
                SAPAA welcomes photos, videos, audio files, and location data. Please
                follow these simple guidelines:
                </p>

                <ul className="list-disc pl-6 space-y-2">
                <li>
                    <strong>File name format:</strong>{" "}
                    <code className="bg-[#F7F2EA] px-1 rounded">
                    WHERE_WHEN_WHO_IDENTIFIER
                    </code>
                </li>
                <li>
                    <strong>Good example:</strong> BilbyNA_2098-12-31_JSmith_PineForest
                </li>
                <li>
                    <strong>Not recommended:</strong> IMG_1234
                </li>
                <li>
                    Resize images to no more than 1,000 pixels on the longest side.
                </li>
                <li>
                    Crop unnecessary background — focus on the subject.
                </li>
                <li>
                    Captions may include subject, site, date, and photographer name.
                </li>
                <li>
                    Watermarks are allowed.
                </li>
                </ul>
            </section>
            <section className="space-y-2">
                <h3 className="text-lg font-bold text-[#254431]">
                6. Notes and Further Reading
                </h3>
                <p>
                To better understand how Alberta’s Occupational Health and Safety
                legislation may apply, vist: <a
                        href="https://myorgbio.org/2023/11/22/notes-about-a-safe-space-ohs-and-the-non-profit/"
                        className="underline text-[#356B43]"
                    >Notes About a Safe Space 
                – OHS and the Non-Profit | Organizational Biology.
                </a> 
                </p>
            </section>

            </div>

          <div className="p-6 border-t border-[#E4EBE4] bg-[#F7F2EA]/60 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <p className="text-xs text-[#7A8075]">
              Last updated: January 2026
            </p>
            <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#356B43] underline hover:text-[#254431] transition-colors"
            >
            Return to application
            </button>

          </div>
        </div>
      </main>
    </div>
  );
}
