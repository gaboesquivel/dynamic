"use client";

interface GuessRowProps {
  guess: string;
  feedback: Array<"correct" | "present" | "absent">;
  isCurrentRow: boolean;
  currentInput: string;
}

export default function GuessRow({
  guess,
  feedback,
  isCurrentRow,
  currentInput,
}: GuessRowProps) {
  const displayValue = isCurrentRow ? currentInput : guess;
  const maxLength = 9;

  return (
    <div className="flex gap-1 justify-center">
      {[...Array(maxLength)].map((_, i) => {
        const char = displayValue[i] || "";
        const isActive = isCurrentRow && i < displayValue.length;
        const feedbackType = feedback[i];

        let bgColor = "bg-muted border-2 border-border";
        if (isActive && !isCurrentRow) {
          if (feedbackType === "correct") {
            bgColor = "bg-green-500 border-2 border-green-600";
          } else if (feedbackType === "present") {
            bgColor = "bg-yellow-400 border-2 border-yellow-500";
          } else if (feedbackType === "absent") {
            bgColor = "bg-gray-500 border-2 border-gray-600";
          }
        }

        return (
          <div
            key={i}
            className={`
              w-12 h-12 flex items-center justify-center text-xl font-bold
              rounded transition-all duration-200 ${bgColor}
              ${isCurrentRow ? "border-2 border-primary" : ""}
              ${isActive && isCurrentRow ? "scale-105" : ""}
            `}
          >
            <span
              className={
                isActive && !isCurrentRow ? "text-white" : "text-foreground"
              }
            >
              {char}
            </span>
          </div>
        );
      })}
    </div>
  );
}
