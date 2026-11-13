import { memo, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "motion/react";
import {
  CircleCheck,
  Clock3,
  FileStack,
  Sparkles,
  ChartNoAxesCombined,
} from "lucide-react";
import { Card } from "@/components/admin/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { DotPattern } from "@/components/ui/dot-pattern";

const icons = {
  file: FileStack,
  spark: Sparkles,
  clock: Clock3,
  circleCheck: CircleCheck,
  chart: ChartNoAxesCombined,
  check: CircleCheck,
};
const previousValues = new Map<string, number>();

function Metric({ element }: { element: HTMLElement }) {
  const {
    label = "",
    value = "0",
    foot = "",
    tone = "",
    icon = "file",
    metricKey = "",
    suffix = "",
  } = element.dataset;
  const amount = Number(value);
  const reducedMotion = useReducedMotion();
  const [start] = useState(() => previousValues.get(metricKey) ?? 0);
  useLayoutEffect(() => {
    previousValues.set(metricKey, amount);
  }, [metricKey, amount]);
  const Icon = icons[icon as keyof typeof icons] ?? FileStack;
  return (
    <Card className={`metric ${tone}`}>
      <div className="label">{label}</div>
      <div className="metric-icon">
        <Icon />
      </div>
      <div
        className="value"
        role="img"
        aria-label={`${label}: ${value}${suffix}`}
      >
        {reducedMotion || !Number.isFinite(amount) || start === amount ? (
          <span>{value}</span>
        ) : (
          <NumberTicker
            aria-hidden="true"
            value={amount}
            startValue={start}
            decimalPlaces={(value.split(".")[1] || "").length}
            className="metric-number"
          />
        )}
        {suffix && <small>{suffix}</small>}
      </div>
      <div className="foot">
        <span className="metric-dot" />
        {foot}
      </div>
    </Card>
  );
}

// The established grader owns forms, tables and dialogs. React owns only the
// shell and these explicit slots; never reconcile teacher-edited form fields.
export const WorkspaceContent = memo(function WorkspaceContent({
  html,
}: {
  html: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<HTMLElement[]>([]);
  useLayoutEffect(() => {
    setTargets(
      Array.from(
        content.current?.querySelectorAll<HTMLElement>(
          "[data-ui-metric], [data-ui-pattern]",
        ) ?? [],
      ),
    );
  }, [html]);
  return (
    <>
      <div
        className="workspace-content"
        ref={content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {targets.map((element, index) =>
        createPortal(
          element.hasAttribute("data-ui-metric") ? (
            <Metric element={element} />
          ) : (
            <DotPattern
              width={18}
              height={18}
              cr={1}
              className="rubric-dot-pattern"
              aria-hidden="true"
            />
          ),
          element,
          String(index),
        ),
      )}
    </>
  );
});
