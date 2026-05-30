/*
  CONCEPT BOX

  useRef
  creates a empty box (formatted like an object) that persists across re-renders
  has a single property - .current - where all the value lives
  the useRef box lives in the JavaScript code, starts empty, and has nothing to do with whats shown on screen 
 
  useState v.s useRef - changing state will cause a re-render, changing a ref does NOT
  the values in ref can change without re-rendering the ui 

  canvas
  an HTML element - this is the actual rectangle that will appear on the screen 
  React creates this when it runs the return statement - takes the element from the ref box to fill the canvas box

  order of events
  1. const canvasRef = useRef(null)   → box created, empty
  2. return <canvas ref={canvasRef} /> → React creates the canvas element and puts it in the box
  3. useEffect runs → const canvas = canvasRef.current  → reach into the box, canvas element is in there

  getContext(2d)
  getContext - built in method given to every canvas element - gives you an object full of drawing tools
  2d - gives us tge 2D drawing API (flat shapes, lines, images, fills)
  without this object you would have a canvas but now way to draw on it 

  draw()
  a function created by the developer
  our draw function (1) wipes the canvas clean (2) calculates where the wave should be right now (3) paints it onto the canvas using the object returned from canvas.getContext("2d")
  the function contains all the instructions for painting one frame of the wave animation onto the canvas 
  it calls itself repeatedly to keep the animation going - runs 60 times per second via requestAnimationFrame

  requestAnimationFrame
  built in browser function that schedules a function to run before the next screen repaints (60 times/second)
  after draw() you call requestAnimationFrame(draw) to schedule draw again()
  this creates the looping of the wave animation 
  requestAnimationFrame returns a ticket number that you need to cancel the loop later in cleanup 

  useEffect
  React hook that runs code after a component appears on the screen - the empty [] at the end means run once when the component first mounts
  this is needed because you cant draw on the canvas until it exists on the screen 
  whatever function is returned from useEffect will run when the component unmounts (cleanup)

  Web Audio API - consists of three pieces
  1. getUserMedia -> asks browser for mic permission, returns live audio stream
  2. AudioContext -> the audio engine - nothing audio related works without this 
  3. AnalyserNode -> sits in the audio chain and lets you read the data without changing it

  analyserRef
  box holds the AnalyserNode after mic connects
  draw() checks this box 60 times per second to read fresh audio data
  stored in ref not a variable because it ends to survive re-renders

  dataArrayRef
  box that holds an array of 256 numbers (each 0-255)
  Uint8Array = array of unsigned 8-bit integers, meaning whole numbers 0-255 only
  128 = silence, above or below 128 = sound is happening
  every frame the analyser fills this array with fresh audio data
  draw() reads these numbers to know how loud the mic is right now

  Math.sin()
  a math function that produces a smooth curve between -1 and 1
  that curve shape is exactly what a wave looks like
  x * frequency spreads peaks across the canvas width
  t * speed makes the wave travel sideways as time passes
  amplitude controls how tall the peaks are
  micAmplitude scales the amplitude based on how loud the mic is

  micAmplitude
  a number between 0.5 and 3.0 calculated from the loudest moment in the mic data
  silence = 0.5 (small waves), loud breath = 3.0 (big waves)
  multiplied by each wave's amplitude before drawing
  waves never fully disappear because minimum is 0.5 not 0

  the three wave layers
  three separate filled shapes drawn on top of each other
  each has different amplitude, frequency, speed, color opacity, and vertical offset
  stacking them at different opacities creates the water depth effect
  each is a closed filled shape - wave curve across top, drop to bottom, fill with blue

  cleanup
  the function returned from useEffect
  React calls it automatically when user navigates away from the page
  cancelAnimationFrame stops the draw loop
  stream.getTracks().forEach(t => t.stop()) stops the mic
  audioCtx.close() releases the audio engine
  without cleanup the mic keeps recording and loop keeps running in the background forever

*/



import { useRef, useEffect } from "react";

export default function WaveForm() {

  //ref -> an empty box that persists across re-renders

  //a ref box for the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //a ref box for the audio reader
  const analyserRef = useRef<AnalyserNode | null>(null);

  //a ref box for 256 audio numbers
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

    // set up the mic and store audio tools in the ref boxes so draw() can use them 
    const setup = async () => {
      try {
        //ask for mic permission, wait for response
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        //open the audio engine - built browser object that is the Web Audio Engine 
        //Web Audio engine is part of the built in Web Audio API which is a system for processing audio 
        audioCtx = new AudioContext();

        //plug mic stream into audio engine
        const source = audioCtx.createMediaStreamSource(stream);

        //create reader that peeks at audio data
        const analyser = audioCtx.createAnalyser();

        // 512 gives us 256 data points per frame
        analyser.fftSize = 512;

        // connect mic into the reader
        source.connect(analyser);

        // save reader into its box so draw() can reach it
        analyserRef.current = analyser;

        // create 256 slot number container, save into its box
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

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

      //short cut references to the canvas's width and height - to mak referencing more efficient 
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
        // TypeScript's definition may use ArrayBufferLike which can include SharedArrayBuffer
        // Cast to the expected Uint8Array with ArrayBuffer to satisfy the analyser API
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

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

    //clean up 
    return () => {
      //stops the draw loop
      cancelAnimationFrame(animId);
      //stops the microphone
      stream?.getTracks().forEach((t) => t.stop());
      //closes the audio engine and releases it from memory 
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
