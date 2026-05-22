import { useRef, useEffect } from "react";

export default function WaveForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100px",
        background: "#071A2E",
      }}
    />
  );
}
