import React from "react";

interface DecorativeBackgroundProps {
  topLeftColor?: string;
  bottomRightColor?: string;
  opacity?: number;
  showGrid?: boolean;
}

export default function DecorativeBackground({
  topLeftColor = "#818cf8",
  bottomRightColor = "#c084fc",
  opacity = 0.85,
  showGrid = true,
}: DecorativeBackgroundProps) {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none select-none"
      style={{ opacity }}
    >
      {/* 1. Subtle Radial Matrix Grid */}
      {showGrid && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.09) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      )}

      {/* 2. Top-Right Ambient Mesh Blob */}
      <div
        className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full blur-[100px] opacity-70 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${topLeftColor} 0%, rgba(99, 102, 241, 0.2) 50%, transparent 70%)`,
          animationDuration: "8s",
        }}
      />

      {/* 3. Bottom-Left Ambient Mesh Blob with Warm Gold Accent */}
      <div
        className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-60"
        style={{
          background: `radial-gradient(circle, ${bottomRightColor} 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)`,
        }}
      />

      {/* 4. Center Subtle Radial Illumination */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(129, 140, 248, 0.25) 0%, rgba(192, 132, 252, 0.15) 50%, transparent 75%)",
        }}
      />
    </div>
  );
}
