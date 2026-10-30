import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/**
 * Stickman elephant — drawing verified via the svg-creator feedback loop.
 * Subtle idle motion: trunk sway, ear flap, body bob, tail swish, head nod.
 */
export const Elephant = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bob = Math.sin(frame / 10) * 4;
  const trunkSway = Math.sin(frame / 12) * 4;
  const earFlap = Math.sin(frame / 9) * 3.5;
  const tailSwish = Math.sin(frame / 8) * 8;
  const headNod = Math.sin(frame / 14) * 2.5;

  const stroke = "#111111";

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", opacity: fadeIn }}>
      <svg viewBox="0 0 800 560" width="100%" role="img" aria-label="Stickman elephant">
        <title>Stickman elephant</title>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="linearRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset in="blur" dx="3" dy="5" result="offset" />
            <feFlood floodColor="#1e1b4b" floodOpacity="0.2" result="color" />
            <feComposite in="color" in2="offset" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="800" height="560" fill="#ffffff" />
        <line x1="80" y1="468" x2="720" y2="468" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round" opacity="0.25" />

        <g transform={`translate(0 ${bob})`}>
          {/* body */}
          <g filter="url(#shadow)" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M 350 272 Q 420 250 480 252" strokeWidth="7" />
            <path d="M 480 252 L 500 216" strokeWidth="7" />
            <path d="M 480 252 L 502 340 L 494 460" strokeWidth="7" />
            <path d="M 480 252 L 452 342 L 468 460" strokeWidth="7" />
            <path d="M 350 272 L 328 352 L 336 460" strokeWidth="7" />
            <path d="M 350 272 L 374 348 L 386 460" strokeWidth="7" />
            <g transform={`rotate(${tailSwish} 350 272)`}>
              <path d="M 350 272 C 296 260 280 300 296 345" strokeWidth="5" />
            </g>
          </g>

          {/* head group nods */}
          <g transform={`rotate(${headNod} 480 252)`}>
            {/* ear behind head */}
            <g stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
              <g transform={`rotate(${earFlap} 556 150)`}>
                <ellipse cx="505" cy="148" rx="70" ry="56" fill="#c9cdd4" stroke={stroke} strokeWidth="4.5" />
                <path d="M 468 116 C 500 98 545 104 562 132" fill="none" stroke={stroke} strokeWidth="3" opacity="0.55" />
              </g>
              <circle cx="540" cy="180" r="58" fill="#ffffff" stroke={stroke} strokeWidth="6" />
            </g>

            {/* trunk */}
            <g filter="url(#shadow)" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <g transform={`rotate(${trunkSway} 556 228)`}>
                <path d="M 556 228 C 596 240 602 288 600 330 C 599 372 596 408 588 436" strokeWidth="10" />
              </g>
            </g>

            <circle cx="568" cy="166" r="6" fill={stroke} />
          </g>

          {/* tail tuft follows the swish */}
          <g stroke={stroke} strokeLinecap="round" fill="none" transform={`rotate(${tailSwish} 350 272)`}>
            <path d="M 296 345 L 288 362 M 296 345 L 296 364 M 296 345 L 306 360" strokeWidth="3" />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
