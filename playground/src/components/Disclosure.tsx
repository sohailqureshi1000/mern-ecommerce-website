import { useState } from "react";

interface DisclosureProps {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

let idCounter = 0;

export function Disclosure({ summary, children, defaultOpen = false }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // Stable unique id per instance, so multiple Disclosures on one page don't clash
  const [contentId] = useState(() => `disclosure-content-${++idCounter}`);

  return (
    <div className="disclosure">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="disclosure-button"
      >
        <span className={`disclosure-icon ${isOpen ? "open" : ""}`} aria-hidden="true">
          ▶
        </span>
        {summary}
      </button>

      {isOpen && (
        <div id={contentId} className="disclosure-content">
          {children}
        </div>
      )}
    </div>
  );
}