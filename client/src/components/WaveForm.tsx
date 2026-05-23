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
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      const w = canvas!.width;
      const h = canvas!.height;
      const t = Date.now() / 1000; // time in seconds - drives animation
      context!.fillStyle = "#071A2E";
      context!.fillRect(0, 0, w, h);
      waves.forEach((wave) => {
        context!.beginPath();
        context!.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
          const y =
            h / 2 +
            wave.offsetY +
            wave.amplitude * Math.sin(x * wave.frequency + t * wave.speed);
          context!.lineTo(x, y);
        }
        context!.lineTo(w, h);
        context!.lineTo(0, h);
        context!.closePath();
        context!.fillStyle = wave.color;
        context!.fill();
      });

      animId = requestAnimationFrame(draw);
    }
    
    draw();
    return () => cancelAnimationFrame(animId);
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
