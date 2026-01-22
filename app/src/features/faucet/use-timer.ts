import { useEffect, useState } from "react";

const leftPad = (num: number) => num.toString().padStart(2, "0");

export const useTimer = (sec: number) => {
  const [secondsLeft, setSecondsLeft] = useState(sec);

  useEffect(() => {
    setSecondsLeft(sec);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [sec]);

  const m = leftPad(Math.floor(secondsLeft / 60));
  const s = leftPad(secondsLeft % 60);

  const isTicking = secondsLeft > 0;

  return { m, s, isTicking };
};
