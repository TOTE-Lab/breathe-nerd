import { useRef, useEffect } from "react";

export default function WaveForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas?.getContext("2d");
    if (!context) return;
    let animId: number;

    const waves = [
      {
        amplitude: 12,
        frequency: 0.02,
        speed: 1.2,
        color: "rgba(55,138,221,0.3)",
        offsetY: 0,
      },
      {
        amplitude: 8,
        frequency: 0.03,
        speed: 0.8,
        color: "rgba(55,138,221,0.5)",
        offsetY: 6,
      },
      {
        amplitude: 10,
        frequency: 0.025,
        speed: 1.0,
        color: "rgba(133,183,235,0.8)",
        offsetY: 3,
      },
    ];

    function draw() {
        
    }
  }, []);

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
