import React from "react";

interface DecorativeBackgroundProps {
  colorFrom?: string;
  colorTo?: string;
  opacity?: string;
}

export default function DecorativeBackground({
  colorFrom = "indigo",
  colorTo = "purple",
  opacity = "opacity-20",
}: DecorativeBackgroundProps) {
  return (
    <div
      className={`absolute top-0 left-0 w-full h-full overflow-hidden -z-10 ${opacity} pointer-events-none`}
    >
      <div
        className={`absolute -top-24 -left-24 w-96 h-96 rounded-full bg-${colorFrom}-200 blur-3xl`}
      ></div>
      <div
        className={`absolute bottom-0 right-0 w-80 h-80 rounded-full bg-${colorTo}-200 blur-3xl`}
      ></div>
    </div>
  );
}
