import { useRef, useEffect } from "react";

export default function WaveForm() {

  // box for the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // box for the audio reader
  const analyserRef = useRef<AnalyserNode | null>(null);

  // box for 256 audio numbers
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {

    // grab canvas from box, stop if empty
    const canvas = canvasRef.current;
    if (!canvas) return;

    // grab drawing tools, stop if empty
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // slot to store animation frame ticket
    let animId: number;

    // store outside setup so cleanup can reach them
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    // set up the mic
    const setup = async () => {
      try {
        // ask for mic permission, wait for response
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // open the audio engine
        audioCtx = new AudioContext();

        // plug mic stream into audio engine
        const source = audioCtx.createMediaStreamSource(stream);

        // create reader that peeks at audio data
        const analyser = audioCtx.createAnalyser();

        // 512 gives us 256 data points per frame
        analyser.fftSize = 512;

        // connect mic into the reader
        source.connect(analyser);

        // save reader into its box so draw() can reach it
        analyserRef.current = analyser;

        // create 256 slot number container, save into its box
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      } catch (err) {
        // mic denied or failed - waves animate without audio
        console.warn("Mic not available, waves animate without audio", err);
      }
    };
    setup();

    // 3 wave layers with different sizes speeds and colors
    const waves = [
      { amplitude: 12, frequency: 0.02,  speed: 1.2, color: "rgba(55,138,221,0.3)", offsetY: 0 },
      { amplitude: 8,  frequency: 0.03,  speed: 0.8, color: "rgba(55,138,221,0.5)", offsetY: 6 },
      { amplitude: 10, frequency: 0.025, speed: 1.0, color: "rgba(133,183,235,0.8)", offsetY: 3 },
    ];

    function draw() {

      // sync canvas size and clear previous frame
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      const w = canvas!.width;
      const h = canvas!.height;

      // time in seconds drives wave movement
      const t = Date.now() / 1000;

      // paint dark navy background
      ctx!.fillStyle = "#071A2E";
      ctx!.fillRect(0, 0, w, h);

      // default wave size multiplier when no mic
      let micAmplitude = 1;

      // only read mic if both boxes are filled
      if (analyserRef.current && dataArrayRef.current) {

        // fill box with fresh audio numbers this frame
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

        // find the loudest moment in this frame
        let max = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          // 128 = silence, subtract to get distance from silence
          const v = Math.abs(dataArrayRef.current[i]! - 128);
          if (v > max) max = v;
        }

        // convert loudness 0-128 into wave size multiplier 0.5-3.0
        micAmplitude = 0.5 + (max / 25) * 2.5;
      }

      // draw each of the 3 wave layers
      waves.forEach((wave) => {

        // start a new shape
        ctx!.beginPath();

        // place pen at bottom left corner
        ctx!.moveTo(0, h);

        // move across canvas 2px at a time
        for (let x = 0; x <= w; x += 2) {

          // calculate height at this x position
          const y = (h / 2)
            + wave.offsetY
            + (wave.amplitude * micAmplitude)
            * Math.sin((x * wave.frequency) + (t * wave.speed));

          // draw line to this point
          ctx!.lineTo(x, y);
        }

        // drop to bottom right corner
        ctx!.lineTo(w, h);

        // go back to bottom left corner
        ctx!.lineTo(0, h);

        // close the shape
        ctx!.closePath();

        // set fill color for this layer
        ctx!.fillStyle = wave.color;

        // fill the shape
        ctx!.fill();
      });

      // schedule next frame
      animId = requestAnimationFrame(draw);
    }

    // kick off the loop
    draw();

    // stop everything when user navigates away
    return () => {
      cancelAnimationFrame(animId);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close();
    };

  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "120px",
        background: "#071A2E",
      }}
    />
  );
}
