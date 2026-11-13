import { useLayoutEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders a reply as markdown, cut off at a fixed height with a control to show all of it. */
export function Reply({ text, expanded, onToggle }: { text: string; expanded: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body === null) return;
    const measure = () => setOverflows(body.scrollHeight > body.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [text]);

  const isClamped = !expanded && overflows;
  return (
    <div className="reply">
      <div ref={bodyRef} className={`reply__body prose ${expanded ? "" : "reply__body--clamped"} ${isClamped ? "reply__body--faded" : ""}`}>
        <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
      </div>
      {(overflows || expanded) && (
        <button type="button" className="text-button" onClick={onToggle}>
          {expanded ? "Show less" : "Show full reply"}
        </button>
      )}
    </div>
  );
}
