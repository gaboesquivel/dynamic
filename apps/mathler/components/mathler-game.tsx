"use client";

import { useState, useEffect } from "react";
import { evaluateExpression, getRandomTarget } from "@/lib/math-utils";
import GuessRow from "./guess-row";
import GameKeypad from "./game-keypad";
import GameStatus from "./game-status";

export default function MathlerGame() {
  const [target, setTarget] = useState<number>(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing",
  );
  const [feedback, setFeedback] = useState<
    Array<Array<"correct" | "present" | "absent">>
  >([]);

  useEffect(() => {
    setTarget(getRandomTarget());
  }, []);

  const handleInputChange = (value: string) => {
    if (value.length <= 9) {
      setCurrentInput(value);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(currentInput.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!currentInput) return;

    try {
      const result = evaluateExpression(currentInput);

      if (result === null) {
        alert("Invalid expression");
        return;
      }

      if (result !== target && guesses.length >= 5) {
        setGameStatus("lost");
        setGuesses([...guesses, currentInput]);
        return;
      }

      const newGuesses = [...guesses, currentInput];
      setGuesses(newGuesses);

      // Calculate feedback
      const feedbackRow = calculateFeedback(currentInput, target.toString());
      setFeedback([...feedback, feedbackRow]);

      if (result === target) {
        setGameStatus("won");
      } else if (newGuesses.length >= 6) {
        setGameStatus("lost");
      }

      setCurrentInput("");
    } catch (error) {
      alert("Invalid expression");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mathler</h1>
        <p className="text-lg text-muted-foreground">
          Find the equation that equals{" "}
          <span className="font-bold text-primary">{target}</span>
        </p>
      </div>

      {/* Game Board */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <GuessRow
            key={i}
            guess={guesses[i] || ""}
            feedback={feedback[i] || []}
            isCurrentRow={i === guesses.length && gameStatus === "playing"}
            currentInput={i === guesses.length ? currentInput : ""}
          />
        ))}
      </div>

      {/* Game Status */}
      {gameStatus !== "playing" && (
        <GameStatus
          status={gameStatus}
          target={target}
          guessCount={guesses.length}
        />
      )}

      {/* Keypad */}
      {gameStatus === "playing" && (
        <GameKeypad
          onInput={handleInputChange}
          onBackspace={handleBackspace}
          onSubmit={handleSubmit}
          currentInput={currentInput}
        />
      )}
    </div>
  );
}

function calculateFeedback(
  guess: string,
  target: string,
): Array<"correct" | "present" | "absent"> {
  const feedback: Array<"correct" | "present" | "absent"> = Array(
    guess.length,
  ).fill("absent");

  // First pass: mark correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      feedback[i] = "correct";
    }
  }

  // Second pass: mark present but wrong position
  const targetChars = target.split("");
  const guessChars = guess.split("");

  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] === "correct") {
      targetChars[i] = "";
      guessChars[i] = "";
    }
  }

  for (let i = 0; i < guess.length; i++) {
    const char = guessChars[i];
    if (char && targetChars.includes(char)) {
      feedback[i] = "present";
      targetChars[targetChars.indexOf(char)] = "";
    }
  }

  return feedback;
}
