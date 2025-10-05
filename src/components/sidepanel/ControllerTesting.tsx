import { useEffect, useRef, useState } from "react";

export default function ControllerTesting() {
  // State for controller input values
  const [controllerState, setControllerState] = useState({
    lx: 0,
    ly: 0,
    rx: 0,
    ry: 0,
    lt: 0,
    rt: 0,
    buttons: Array(20)
      .fill(0)
      .map(() => ({ pressed: false, value: 0 })),
  });

  // State for connected controllers
  const [connectedController, setConnectedController] = useState<{
    name: string;
    index: number;
  } | null>(null);

  // Refs for SVG elements
  const lstickRef = useRef<SVGCircleElement>(null);
  const rstickRef = useRef<SVGCircleElement>(null);
  const l2barRef = useRef<SVGRectElement>(null);
  const r2barRef = useRef<SVGRectElement>(null);

  // Controller button names
  const buttonNames = [
    "A/✕",
    "B/○",
    "X/□",
    "Y/△",
    "L1/LB",
    "R1/RB",
    "L2/LT",
    "R2/RT",
    "Other",
    "Start",
    "L3",
    "R3",
    "D-Up",
    "D-Down",
    "D-Left",
    "D-Right",
    "Meta",
    "Touch/Share",
    "Extra1",
    "Extra2",
  ];

  useEffect(() => {
    let selectedIndex = 0;
    let animationId: number;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 1000 / 30; // 30fps instead of 60fps
    let lastControllerState = {
      lx: 0,
      ly: 0,
      rx: 0,
      ry: 0,
      lt: 0,
      rt: 0,
      buttons: Array(20)
        .fill(null)
        .map(() => ({ pressed: false, value: 0 })),
    };

    const COLOR_GREEN = "rgba(34,197,94,0.85)";
    const COLOR_GREEN_LIGHT = "rgba(34,197,94,0.65)";
    const COLOR_ORANGE = "rgba(255,140,0,1.0)"; // Bright orange for medium input
    const COLOR_GRAY = "rgba(156,163,175,0.6)"; // Gray for inactive

    const getStickColor = (x: number, y: number): string => {
      const magnitude = Math.max(Math.abs(x), Math.abs(y));
      if (magnitude < 0.05) return COLOR_GREEN; // Inactive
      if (magnitude < 0.1) return COLOR_GREEN; // Light input
      if (magnitude < 0.25) return COLOR_ORANGE; // Medium input
      return "rgba(239,68,68,0.9)"; // Heavy input (red)
    };

    const getTriggerColor = (value: number): string => {
      if (value < 0.05) return COLOR_GREEN; // Default gray
      if (value < 0.1) return COLOR_GREEN; // Green for light press
      if (value < 0.25) return COLOR_ORANGE; // Orange for medium press
      return "rgba(239,68,68,0.9)"; // Red for heavy press
    };

    const setGroupPathFill = (groupEl: Element | null, pressed: boolean) => {
      if (!groupEl) return;
      const paths = (groupEl as HTMLElement).querySelectorAll("path");
      const p =
        paths && paths.length
          ? (paths[paths.length - 1] as SVGPathElement)
          : null;
      if (!p) return;
      p.setAttribute(
        "fill",
        pressed ? "rgba(239,68,68,0.9)" : COLOR_GREEN_LIGHT
      );
    };

    const setFill = (el: Element | null, pressed: boolean) => {
      if (!el) return;
      (el as SVGElement).setAttribute(
        "fill",
        pressed ? "rgba(239,68,68,0.9)" : COLOR_GREEN_LIGHT
      );
    };

    function update(currentTime: number) {
      // Throttle updates to 30fps
      if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
        animationId = requestAnimationFrame(update);
        return;
      }
      lastUpdateTime = currentTime;

      const gps = navigator.getGamepads?.() || [];
      const available: number[] = [];
      for (let i = 0; i < gps.length; i++) if (gps[i]) available.push(i);
      if (available.length && !available.includes(selectedIndex)) {
        selectedIndex = available[0];
      }

      const gp = gps[selectedIndex];

      // Update connected controller info
      if (gp && gp.id) {
        setConnectedController({
          name: gp.id,
          index: selectedIndex,
        });
      } else {
        setConnectedController(null);
      }

      if (gp) {
        const ax = (i: number) => Number((gp!.axes[i] || 0).toFixed(3));
        const btn = (i: number) =>
          gp!.buttons[i] || ({ value: 0, pressed: false } as any);

        const lx = ax(0),
          ly = ax(1),
          rx = ax(2),
          ry = ax(3);
        const lt = Number(btn(6).value.toFixed(3));
        const rt = Number(btn(7).value.toFixed(3));

        const newButtons = Array.from({ length: 20 }, (_, i) => {
          const b = btn(i);
          return { pressed: b.pressed, value: b.value };
        });

        const newState = { lx, ly, rx, ry, lt, rt, buttons: newButtons };

        // Only update React state if values actually changed
        const hasChanged =
          lastControllerState.lx !== lx ||
          lastControllerState.ly !== ly ||
          lastControllerState.rx !== rx ||
          lastControllerState.ry !== ry ||
          lastControllerState.lt !== lt ||
          lastControllerState.rt !== rt ||
          newButtons.some(
            (btn, i) =>
              lastControllerState.buttons[i].pressed !== btn.pressed ||
              Math.abs(lastControllerState.buttons[i].value - btn.value) > 0.01
          );

        if (hasChanged) {
          setControllerState(newState);
          lastControllerState = { ...newState, buttons: [...newButtons] };
        }

        // Update SVG elements using refs
        if (lstickRef.current) {
          lstickRef.current.setAttribute("cx", String(113 + lx * 25));
          lstickRef.current.setAttribute("cy", String(160 + ly * 25));
          lstickRef.current.setAttribute("fill", getStickColor(lx, ly));
        }

        if (rstickRef.current) {
          rstickRef.current.setAttribute("cx", String(278 + rx * 25));
          rstickRef.current.setAttribute("cy", String(238 + ry * 25));
          rstickRef.current.setAttribute("fill", getStickColor(rx, ry));
        }

        if (l2barRef.current) {
          const h = Math.max(0, Math.min(42, btn(6).value * 42));
          l2barRef.current.setAttribute("height", String(h));
          l2barRef.current.setAttribute("y", String(44.5 - h));
        }

        if (r2barRef.current) {
          const h = Math.max(0, Math.min(42, btn(7).value * 42));
          r2barRef.current.setAttribute("height", String(h));
          r2barRef.current.setAttribute("y", String(44.5 - h));
        }

        // Update button elements in SVG
        const dup = document.getElementById("DUp");
        const ddown = document.getElementById("DDown");
        const dleft = document.getElementById("DLeft");
        const dright = document.getElementById("DRight");
        const btop = document.getElementById("BTop");
        const bright = document.getElementById("BRight");
        const bbottom = document.getElementById("BBottom");
        const bleft = document.getElementById("BLeft");
        const lmeta = document.getElementById("LMeta");
        const rmeta = document.getElementById("RMeta");
        const l1 = document.getElementById("L1");
        const r1 = document.getElementById("R1");
        const l2 = document.getElementById("L2");
        const r2 = document.getElementById("R2");

        setGroupPathFill(dup, btn(12).pressed);
        setGroupPathFill(ddown, btn(13).pressed);
        setGroupPathFill(dleft, btn(14).pressed);
        setGroupPathFill(dright, btn(15).pressed);
        setGroupPathFill(btop, btn(3).pressed);
        setGroupPathFill(bright, btn(1).pressed);
        setGroupPathFill(bbottom, btn(0).pressed);
        setGroupPathFill(bleft, btn(2).pressed);

        if (lmeta)
          lmeta.setAttribute(
            "fill",
            btn(8).pressed ? "rgba(239,68,68,0.9)" : COLOR_GREEN_LIGHT
          );
        if (rmeta)
          rmeta.setAttribute(
            "fill",
            btn(9).pressed ? "rgba(239,68,68,0.9)" : COLOR_GREEN_LIGHT
          );
        setFill(l1, btn(4).pressed);
        setFill(r1, btn(5).pressed);

        if (l2) l2.setAttribute("fill", getTriggerColor(btn(6).value));
        if (r2) r2.setAttribute("fill", getTriggerColor(btn(7).value));
      }

      animationId = requestAnimationFrame(update);
    }

    animationId = requestAnimationFrame(update);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="h-full bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex flex-col h-full space-y-4">
          {/* Show Connected Controllers or No Controller Connected */}
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-center">
              {connectedController ? (
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {connectedController.name}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    No Controller Connected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Connect a controller to test inputs
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controller SVG */}
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex justify-center items-center">
              <div className="w-full max-w-md">
                <svg
                  width="441"
                  height="383"
                  viewBox="0 0 441 383"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto"
                >
                  <defs></defs>
                  <path
                    id="LOutline"
                    d="M220.5 294.5C220.5 294.5 195 294.5 150 294.5C105 294.5 81.5 378.5 49.5 378.5C17.5 378.5 4 363.9 4 317.5C4 271.1 43.5 165.5 55 137.5C66.5 109.5 95.5 92.0001 128 92.0001C154 92.0001 200.5 92.0001 220.5 92.0001"
                    fill="rgba(64,64,64,0.3)"
                    stroke="rgba(0,0,0,1)"
                    strokeWidth="3"
                  />
                  <path
                    id="ROutline"
                    d="M220 294.5C220 294.5 245.5 294.5 290.5 294.5C335.5 294.5 359 378.5 391 378.5C423 378.5 436.5 363.9 436.5 317.5C436.5 271.1 397 165.5 385.5 137.5C374 109.5 345 92.0001 312.5 92.0001C286.5 92.0001 240 92.0001 220 92.0001"
                    fill="rgba(64,64,64,0.3)"
                    stroke="rgba(0,0,0,1)"
                    strokeWidth="3"
                  />
                  <circle
                    id="LStickOutline"
                    cx="113"
                    cy="160"
                    r="37.5"
                    fill="rgba(64,64,64,0.2)"
                    stroke="rgba(156,163,175,0.8)"
                    strokeWidth="3"
                  />
                  <circle
                    ref={lstickRef}
                    cx="113"
                    cy="160"
                    r="28"
                    fill="rgba(156,163,175,0.6)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <circle
                    id="RStickOutline"
                    cx="278"
                    cy="238"
                    r="37.5"
                    fill="rgba(64,64,64,0.2)"
                    stroke="rgba(156,163,175,0.8)"
                    strokeWidth="3"
                  />
                  <circle
                    ref={rstickRef}
                    cx="278"
                    cy="238"
                    r="28"
                    fill="rgba(156,163,175,0.6)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <circle
                    id="LMeta"
                    cx="185"
                    cy="162"
                    r="10"
                    fill="rgba(0,0,0,0)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <circle
                    id="RMeta"
                    cx="259"
                    cy="162"
                    r="10"
                    fill="rgba(0,0,0,0)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <circle
                    id="DOutline"
                    cx="166"
                    cy="238"
                    r="37.5"
                    fill="rgba(64,64,64,0.2)"
                    stroke="rgba(156,163,175,0.8)"
                    strokeWidth="3"
                  />
                  <g id="DUp">
                    <mask id="path-8-inside-1" fill="white">
                      <path d="M177.669 222.335C180.793 219.21 180.816 213.997 176.868 212.014C176.327 211.743 175.776 211.491 175.215 211.258C172.182 210.002 168.931 209.355 165.648 209.355C162.365 209.355 159.114 210.002 156.081 211.258C155.521 211.491 154.969 211.743 154.429 212.014C150.48 213.997 150.503 219.21 153.627 222.335L159.991 228.698C163.116 231.823 168.181 231.823 171.305 228.698L177.669 222.335Z"></path>
                    </mask>
                    <path
                      d="M177.669 222.335C180.793 219.21 180.816 213.997 176.868 212.014C176.327 211.743 175.776 211.491 175.215 211.258C172.182 210.002 168.931 209.355 165.648 209.355C162.365 209.355 159.114 210.002 156.081 211.258C155.521 211.491 154.969 211.743 154.429 212.014C150.48 213.997 150.503 219.21 153.627 222.335L159.991 228.698C163.116 231.823 168.181 231.823 171.305 228.698L177.669 222.335Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-8-inside-1)"
                    />
                  </g>
                  <g id="DRight">
                    <mask id="path-9-inside-2" fill="white">
                      <path d="M181.447 249.669C184.571 252.793 189.785 252.816 191.768 248.868C192.039 248.327 192.291 247.776 192.523 247.215C193.78 244.182 194.426 240.931 194.426 237.648C194.426 234.365 193.78 231.114 192.523 228.081C192.291 227.521 192.039 226.969 191.768 226.429C189.785 222.48 184.571 222.503 181.447 225.627L175.083 231.991C171.959 235.116 171.959 240.181 175.083 243.305L181.447 249.669Z"></path>
                    </mask>
                    <path
                      d="M181.447 249.669C184.571 252.793 189.785 252.816 191.768 248.868C192.039 248.327 192.291 247.776 192.523 247.215C193.78 244.182 194.426 240.931 194.426 237.648C194.426 234.365 193.78 231.114 192.523 228.081C192.291 227.521 192.039 226.969 191.768 226.429C189.785 222.48 184.571 222.503 181.447 225.627L175.083 231.991C171.959 235.116 171.959 240.181 175.083 243.305L181.447 249.669Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-9-inside-2)"
                    />
                  </g>
                  <g id="DDown">
                    <mask id="path-10-inside-3" fill="white">
                      <path d="M154.113 253.447C150.989 256.571 150.966 261.785 154.914 263.767C155.455 264.039 156.006 264.291 156.566 264.523C159.6 265.78 162.85 266.426 166.134 266.426C169.417 266.426 172.667 265.78 175.701 264.523C176.261 264.291 176.812 264.039 177.353 263.767C181.301 261.785 181.279 256.571 178.154 253.447L171.79 247.083C168.666 243.959 163.601 243.959 160.477 247.083L154.113 253.447Z"></path>
                    </mask>
                    <path
                      d="M154.113 253.447C150.989 256.571 150.966 261.785 154.914 263.767C155.455 264.039 156.006 264.291 156.566 264.523C159.6 265.78 162.85 266.426 166.134 266.426C169.417 266.426 172.667 265.78 175.701 264.523C176.261 264.291 176.812 264.039 177.353 263.767C181.301 261.785 181.279 256.571 178.154 253.447L171.79 247.083C168.666 243.959 163.601 243.959 160.477 247.083L154.113 253.447Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-10-inside-3)"
                    />
                  </g>
                  <g id="DLeft">
                    <mask id="path-11-inside-4" fill="white">
                      <path d="M150.335 226.113C147.21 222.989 141.997 222.966 140.014 226.914C139.743 227.455 139.491 228.006 139.258 228.566C138.002 231.6 137.355 234.85 137.355 238.134C137.355 241.417 138.002 244.667 139.258 247.701C139.491 248.261 139.743 248.812 140.014 249.353C141.997 253.301 147.21 253.279 150.335 250.154L156.698 243.79C159.823 240.666 159.823 235.601 156.698 232.477L150.335 226.113Z"></path>
                    </mask>
                    <path
                      d="M150.335 226.113C147.21 222.989 141.997 222.966 140.014 226.914C139.743 227.455 139.491 228.006 139.258 228.566C138.002 231.6 137.355 234.85 137.355 238.134C137.355 241.417 138.002 244.667 139.258 247.701C139.491 248.261 139.743 248.812 140.014 249.353C141.997 253.301 147.21 253.279 150.335 250.154L156.698 243.79C159.823 240.666 159.823 235.601 156.698 232.477L150.335 226.113Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-11-inside-4)"
                    />
                  </g>
                  <circle
                    id="BOutline"
                    cx="329"
                    cy="160"
                    r="37.5"
                    fill="rgba(64,64,64,0.2)"
                    stroke="rgba(156,163,175,0.8)"
                    strokeWidth="3"
                  />
                  <g id="BTop">
                    <mask id="path-13-inside-5" fill="white">
                      <path d="M340.669 144.335C343.793 141.21 343.816 135.997 339.868 134.014C339.327 133.743 338.776 133.491 338.215 133.258C335.182 132.002 331.931 131.355 328.648 131.355C325.365 131.355 322.114 132.002 319.081 133.258C318.521 133.491 317.969 133.743 317.429 134.014C313.48 135.997 313.503 141.21 316.627 144.335L322.991 150.698C326.116 153.823 331.181 153.823 334.305 150.698L340.669 144.335Z"></path>
                    </mask>
                    <path
                      d="M340.669 144.335C343.793 141.21 343.816 135.997 339.868 134.014C339.327 133.743 338.776 133.491 338.215 133.258C335.182 132.002 331.931 131.355 328.648 131.355C325.365 131.355 322.114 132.002 319.081 133.258C318.521 133.491 317.969 133.743 317.429 134.014C313.48 135.997 313.503 141.21 316.627 144.335L322.991 150.698C326.116 153.823 331.181 153.823 334.305 150.698L340.669 144.335Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-13-inside-5)"
                    />
                  </g>
                  <g id="BRight">
                    <mask id="path-14-inside-6" fill="white">
                      <path d="M344.447 171.669C347.571 174.793 352.785 174.816 354.768 170.868C355.039 170.327 355.291 169.776 355.523 169.215C356.78 166.182 357.426 162.931 357.426 159.648C357.426 156.365 356.78 153.114 355.523 150.081C355.291 149.521 355.039 148.969 354.768 148.429C352.785 144.48 347.571 144.503 344.447 147.627L338.083 153.991C334.959 157.116 334.959 162.181 338.083 165.305L344.447 171.669Z"></path>
                    </mask>
                    <path
                      d="M344.447 171.669C347.571 174.793 352.785 174.816 354.768 170.868C355.039 170.327 355.291 169.776 355.523 169.215C356.78 166.182 357.426 162.931 357.426 159.648C357.426 156.365 356.78 153.114 355.523 150.081C355.291 149.521 355.039 148.969 354.768 148.429C352.785 144.48 347.571 144.503 344.447 147.627L338.083 153.991C334.959 157.116 334.959 162.181 338.083 165.305L344.447 171.669Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-14-inside-6)"
                    />
                  </g>
                  <g id="BBottom">
                    <mask id="path-15-inside-7" fill="white">
                      <path d="M317.113 175.447C313.989 178.571 313.966 183.785 317.914 185.767C318.455 186.039 319.006 186.291 319.566 186.523C322.6 187.78 325.85 188.426 329.134 188.426C332.417 188.426 335.667 187.78 338.701 186.523C339.261 186.291 339.812 186.039 340.353 185.767C344.301 183.785 344.279 178.571 341.154 175.447L334.79 169.083C331.666 165.959 326.601 165.959 323.477 169.083L317.113 175.447Z"></path>
                    </mask>
                    <path
                      d="M317.113 175.447C313.989 178.571 313.966 183.785 317.914 185.767C318.455 186.039 319.006 186.291 319.566 186.523C322.6 187.78 325.85 188.426 329.134 188.426C332.417 188.426 335.667 187.78 338.701 186.523C339.261 186.291 339.812 186.039 340.353 185.767C344.301 183.785 344.279 178.571 341.154 175.447L334.79 169.083C331.666 165.959 326.601 165.959 323.477 169.083L317.113 175.447Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-15-inside-7)"
                    />
                  </g>
                  <g id="BLeft">
                    <mask id="path-16-inside-8" fill="white">
                      <path d="M313.335 148.113C310.21 144.989 304.997 144.966 303.014 148.914C302.743 149.455 302.491 150.006 302.258 150.566C301.002 153.6 300.355 156.851 300.355 160.134C300.355 163.417 301.002 166.668 302.258 169.701C302.491 170.261 302.743 170.812 303.014 171.353C304.997 175.301 310.21 175.279 313.335 172.154L319.698 165.79C322.823 162.666 322.823 157.601 319.698 154.477L313.335 148.113Z"></path>
                    </mask>
                    <path
                      d="M313.335 148.113C310.21 144.989 304.997 144.966 303.014 148.914C302.743 149.455 302.491 150.006 302.258 150.566C301.002 153.6 300.355 156.851 300.355 160.134C300.355 163.417 301.002 166.668 302.258 169.701C302.491 170.261 302.743 170.812 303.014 171.353C304.997 175.301 310.21 175.279 313.335 172.154L319.698 165.79C322.823 162.666 322.823 157.601 319.698 154.477L313.335 148.113Z"
                      fill="rgba(156,163,175,0.8)"
                      stroke="black"
                      strokeWidth="6"
                      mask="url(#path-16-inside-8)"
                    />
                  </g>
                  <rect
                    id="L1"
                    x="111.5"
                    y="61.5"
                    width="41"
                    height="13"
                    rx="6.5"
                    fill="rgba(64,64,64,0.2)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <rect
                    id="R1"
                    x="289.5"
                    y="61.5"
                    width="41"
                    height="13"
                    rx="6.5"
                    fill="rgba(64,64,64,0.2)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <path
                    id="L2"
                    d="M152.5 37C152.5 41.1421 149.142 44.5 145 44.5H132C127.858 44.5 124.5 41.1421 124.5 37V16.5C124.5 8.76801 130.768 2.5 138.5 2.5C146.232 2.5 152.5 8.76801 152.5 16.5V37Z"
                    fill="rgba(64,64,64,0.2)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <path
                    id="R2"
                    d="M317.5 37C317.5 41.1421 314.142 44.5 310 44.5H297C292.858 44.5 289.5 41.1421 289.5 37V16.5C289.5 8.76801 295.768 2.5 303.5 2.5C311.232 2.5 317.5 8.76801 317.5 16.5V37Z"
                    fill="rgba(64,64,64,0.2)"
                    stroke="black"
                    strokeWidth="3"
                  />
                  <rect
                    ref={l2barRef}
                    x="104.5"
                    y="2.5"
                    width="10"
                    height="0"
                    fill="rgba(156,163,175,0.6)"
                  />
                  <rect
                    ref={r2barRef}
                    x="329.5"
                    y="2.5"
                    width="10"
                    height="0"
                    fill="rgba(156,163,175,0.6)"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-card rounded-lg p-4 border">
            <div className="pb-3">
              <div className="text-sm font-medium">Controller Input</div>
            </div>
            <div>
              <div className="flex w-full border-b">
                <button
                  className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                  data-state="active"
                >
                  Sticks
                </button>
                <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
                  Triggers
                </button>
                <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
                  Buttons
                </button>
              </div>

              {/* Joystick Axes Tab */}
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Left X</span>
                    <span className="font-mono text-sm">
                      {controllerState.lx.toFixed(3)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden border">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-muted-foreground/60 -translate-x-1/2" />
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        Math.abs(controllerState.lx) > 0.25
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : "bg-gradient-to-r from-green-500 to-green-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(controllerState.lx) * 50,
                          50
                        )}%`,
                        marginLeft: `${
                          controllerState.lx >= 0
                            ? 50
                            : 50 -
                              Math.min(Math.abs(controllerState.lx) * 50, 50)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Left Y</span>
                    <span className="font-mono text-sm">
                      {controllerState.ly.toFixed(3)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden border">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-muted-foreground/60 -translate-x-1/2" />
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        Math.abs(controllerState.ly) > 0.25
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : "bg-gradient-to-r from-green-500 to-green-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(controllerState.ly) * 50,
                          50
                        )}%`,
                        marginLeft: `${
                          controllerState.ly >= 0
                            ? 50
                            : 50 -
                              Math.min(Math.abs(controllerState.ly) * 50, 50)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Right X</span>
                    <span className="font-mono text-sm">
                      {controllerState.rx.toFixed(3)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden border">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-muted-foreground/60 -translate-x-1/2" />
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        Math.abs(controllerState.rx) > 0.25
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : "bg-gradient-to-r from-green-500 to-green-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(controllerState.rx) * 50,
                          50
                        )}%`,
                        marginLeft: `${
                          controllerState.rx >= 0
                            ? 50
                            : 50 -
                              Math.min(Math.abs(controllerState.rx) * 50, 50)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Right Y</span>
                    <span className="font-mono text-sm">
                      {controllerState.ry.toFixed(3)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden border">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-muted-foreground/60 -translate-x-1/2" />
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        Math.abs(controllerState.ry) > 0.25
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : "bg-gradient-to-r from-green-500 to-green-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(controllerState.ry) * 50,
                          50
                        )}%`,
                        marginLeft: `${
                          controllerState.ry >= 0
                            ? 50
                            : 50 -
                              Math.min(Math.abs(controllerState.ry) * 50, 50)
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
