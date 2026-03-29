'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';

// ── Shared styling for all Joyride tooltips ──────────────────────────────────
const joyrideStyles = {
  options: {
    primaryColor: '#356B43',
    backgroundColor: '#ffffff',
    textColor: '#1E2520',
    arrowColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    border: '2px solid #E4EBE4',
  },
  tooltipTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#254431',
    marginBottom: '8px',
  },
  tooltipContent: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#374151',
  },
  buttonNext: {
    backgroundColor: '#356B43',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  buttonBack: {
    color: '#356B43',
    fontWeight: '600',
    fontSize: '14px',
  },
  buttonSkip: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: '14px',
  },
};

// ── Tutorial steps for the SITES (main dashboard) page ─────────────────────
export const sitesDashboardSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '👋 Welcome to SAPAA!',
    content:
      'This short tutorial will walk you through the main features of the application. You can skip at any time or replay it later from the Help menu.',
  },
  {
    target: '#tutorial-header',
    disableBeacon: true,
    title: '🌿 The Main Header',
    content:
      'This is the SAPAA header. You can always navigate back to this main screen from anywhere in the app. If you are an administrator, you will also see the Admin button here.',
  },
  {
    target: '#tutorial-stats',
    disableBeacon: true,
    title: '📊 Key Statistics',
    content:
      'These cards give you a quick overview of the entire program — how many protected sites there are, how many have been inspected, total inspection responses submitted, sites active within the past year, and sites that may need attention.',
  },
  {
    target: '#tutorial-search',
    disableBeacon: true,
    title: '🔍 Search for a Site',
    content:
      'Use this search bar to quickly find a specific protected area by its name or by county. Just start typing and the list below will filter automatically.',
  },
  {
    target: '#tutorial-sort',
    disableBeacon: true,
    title: '↕️ Sorting the List',
    content:
      'You can sort the site list by name (A–Z or Z–A) or by the date of last inspection (most recent or oldest first) using this Sort button.',
  },
  {
    target: '#tutorial-site-list',
    // placement: 'top',
    disableBeacon: true,
    title: '📍 Protected Sites',
    content:
      'Each card represents a protected area. You can see the site name, county, last inspection date, and an inspection status badge (Recent, Past Year, Over 1 Year, or Needs Review). Click any card to view that site\'s full inspection history.',
  },
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '✅ You\'re All Set!',
    content:
      'Click on any site card to open its detail page, where you can view past inspections and start a new one. You can replay this tutorial anytime from the Help menu in the top-right corner.',
  },
];

// ── Tutorial steps for the SITE DETAIL page ────────────────────────────────
export const siteDetailSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '📋 Site Detail Page',
    content:
      'This page shows you everything about a specific protected area — its inspection history, scores, and photos. Let\'s take a quick look at the key sections.',
  },
  {
    target: '#tutorial-detail-header',
    disableBeacon: true,
    title: '🗺️ Site Information',
    content:
      'The header shows the site name, county, and how long ago the last visit was. Use the Back button to return to the main sites list.',
  },
  {
    target: '#tutorial-detail-stats',
    disableBeacon: true,
    title: '📈 Site Statistics',
    content:
      'These cards summarise the total number of inspection reports for this site, the average naturalness score across all reports, and the overall condition rating.',
  },
  {
    target: '#tutorial-new-report',
    disableBeacon: true,
    title: '✏️ Starting an Inspection',
    content:
      'Ready to record a site inspection? Click this button to open the inspection form. It will guide you through each section — just answer the questions about what you observe at the site.',
  },
  {
    target: '#tutorial-view-toggle',
    disableBeacon: true,
    title: '🔄 Viewing Past Reports',
    content:
      'Use these three view modes to explore past inspection data: "View by Date" shows reports in chronological order, "Compare by Question" lets you see how answers to each question have changed over time, and "Image Gallery" displays all photos from inspections.',
  },
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '🎉 You\'re Ready to Inspect!',
    content:
      'That\'s everything you need to know to get started. Click "New Site Inspection Report" whenever you arrive at a site and want to record your observations. Good luck out there!',
  },
];

// ── Props ───────────────────────────────────────────────────────────────────
interface TutorialOverlayProps {
  steps: Step[];
  /** A unique key used to store completion state in localStorage, e.g. "sites" */
  tutorialKey: string;
  /** The user's ID (or email) so the state is per-user on this device */
  userId: string | null;
  /** If true, the tutorial will start even if already completed (e.g. triggered manually) */
  forceRun?: boolean;
  /** Called when the tour finishes or is skipped */
  onFinish?: () => void;
}

export default function TutorialOverlay({
  steps,
  tutorialKey,
  userId,
  forceRun = false,
  onFinish,
}: TutorialOverlayProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const storageKey = userId
    ? `sapaa_tutorial_${tutorialKey}_${userId}`
    : null;

  useEffect(() => {
    if (forceRun) {
      setStepIndex(0);
      setRun(true);
      return;
    }
    if (!storageKey) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      // Small delay so page elements have a chance to mount
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
  }, [forceRun, storageKey]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, index, type } = data;

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      }

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setRun(false);
        if (storageKey) {
          localStorage.setItem(storageKey, 'true');
        }
        onFinish?.();
      }
    },
    [storageKey, onFinish]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      disableScrolling={false}
      scrollToFirstStep
      scrollOffset={350}
      spotlightClicks={false}
      styles={joyrideStyles}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next →',
        skip: 'Skip Tutorial',
      }}
      callback={handleCallback}
    />
  );
}