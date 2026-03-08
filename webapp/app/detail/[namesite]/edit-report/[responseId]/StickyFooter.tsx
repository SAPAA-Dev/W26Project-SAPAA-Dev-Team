// In StickyFooter.tsx
interface Props {
    questions: Question[];
    responses: Record<number, any>;
    onSubmit: () => void;
    submitLabel?: string; // add this
  }
  
  // Then in the button:
  <button onClick={onSubmit}>{submitLabel ?? "Submit Report"}</button>