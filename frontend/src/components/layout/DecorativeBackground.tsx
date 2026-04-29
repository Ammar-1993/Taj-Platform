import React from "react";

interface DecorativeBackgroundProps {
  topLeftColor?: string;
  bottomRightColor?: string;
  opacity?: number;
}

export default function DecorativeBackground({
  topLeftColor = "#c4b5fd",
  bottomRightColor = "#d8b4fe",
  opacity = 0.2,
}: DecorativeBackgroundProps) {
  return (
    <div
      className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none"
      style={{ opacity }}
    >
      <div
        className="absolute top-[10%] -left-20 w-96 h-96 rounded-full blur-[120px]"
        style={{ backgroundColor: topLeftColor }}
      />
      <div
        className="absolute bottom-[20%] -right-20 w-[600px] h-[600px] rounded-full blur-[150px]"
        style={{ backgroundColor: bottomRightColor }}
      />
    </div>
  );
}
