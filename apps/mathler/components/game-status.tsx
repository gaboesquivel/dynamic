"use client";

interface GameStatusProps {
  status: "won" | "lost";
  target: number;
  guessCount: number;
}

export default function GameStatus({
  status,
  target,
  guessCount,
}: GameStatusProps) {
  return (
    <div
      className={`p-4 rounded-lg text-center ${
        status === "won"
          ? "bg-green-500/20 border-2 border-green-500"
          : "bg-red-500/20 border-2 border-red-500"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-2 ${status === "won" ? "text-green-600" : "text-red-600"}`}
      >
        {status === "won" ? "🎉 You Won!" : "😢 Game Over"}
      </h2>
      <p className="text-foreground">
        {status === "won"
          ? `You solved it in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}!`
          : `The answer was ${target}`}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Play Again
      </button>
    </div>
  );
}
