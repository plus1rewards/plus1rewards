// plus1-rewards/src/components/auth/PatternLock.tsx
import { useState, useRef, useEffect } from 'react';

interface Point { x: number; y: number; index: number; }

interface PatternLockProps {
  onPatternComplete: (pattern: number[]) => void;
  gridSize?: number;
  minDots?: number;
  disabled?: boolean;
  error?: string;
}

const NEON   = '#00ff88';
const DIM    = 'rgba(0,255,136,0.18)';
const GLOW   = 'rgba(0,255,136,0.08)';
const LINE   = 'rgba(0,255,136,0.7)';
const ERROR  = '#ff4444';

export default function PatternLock({
  onPatternComplete,
  gridSize = 4,
  minDots = 4,
  disabled = false,
  error = '',
}: PatternLockProps) {
  const [pattern, setPattern]       = useState<number[]>([]);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing]   = useState(false);
  const [flash, setFlash]           = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dots, setDots]             = useState<Point[]>([]);

  const DOT_R    = 10;
  const ACTIVE_R = 14;
  const PAD      = 52;
  const SIZE     = 300;

  useEffect(() => {
    const spacing = (SIZE - 2 * PAD) / (gridSize - 1);
    const d: Point[] = [];
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++)
        d.push({ x: PAD + c * spacing, y: PAD + r * spacing, index: r * gridSize + c });
    setDots(d);
  }, [gridSize]);

  // Flash on error
  useEffect(() => {
    if (error) { setFlash(true); setTimeout(() => setFlash(false), 500); }
  }, [error]);

  const addDot = (idx: number) => {
    if (pattern.includes(idx)) return;
    const next = [...pattern, idx];
    setPattern(next);
  };

  const getDotAt = (x: number, y: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((x - rect.left) / rect.width) * SIZE;
    const sy = ((y - rect.top) / rect.height) * SIZE;
    // Find the closest dot within a generous radius
    let closest: number | null = null;
    let closestDist = Infinity;
    for (const d of dots) {
      const dist = Math.hypot(sx - d.x, sy - d.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = d.index;
      }
    }
    // Only register if within 28px (generous hit area)
    return closestDist <= 28 ? closest : null;
  };

  const onStart = (x: number, y: number) => {
    if (disabled) return;
    const idx = getDotAt(x, y);
    if (idx !== null) { setIsDrawing(true); setPattern([idx]); setCurrentPos({ x, y }); }
  };

  const onMove = (x: number, y: number) => {
    if (!isDrawing || disabled) return;
    setCurrentPos({ x, y });
    const idx = getDotAt(x, y);
    if (idx !== null && !pattern.includes(idx)) addDot(idx);
  };

  const onEnd = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    setCurrentPos(null);
    if (pattern.length >= minDots) {
      onPatternComplete(pattern);
    } else {
      setTimeout(() => setPattern([]), 400);
    }
  };

  const linePoints = () => {
    const pts = pattern.map(i => dots.find(d => d.index === i)).filter(Boolean) as Point[];
    const result = pts.map(d => ({ x: d.x, y: d.y }));
    if (isDrawing && currentPos && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      result.push({
        x: ((currentPos.x - rect.left) / rect.width) * SIZE,
        y: ((currentPos.y - rect.top) / rect.height) * SIZE,
      });
    }
    return result;
  };

  const pts = linePoints();
  const hasError = !!error;
  const lineColor = hasError ? ERROR : LINE;
  const nodeColor = hasError ? ERROR : NEON;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        width={SIZE} height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="touch-none select-none w-full max-w-[300px]"
        style={{
          cursor: disabled ? 'not-allowed' : 'crosshair',
          filter: flash ? `drop-shadow(0 0 12px ${ERROR})` : undefined,
          transition: 'filter 0.15s',
        }}
        onMouseDown={e => onStart(e.clientX, e.clientY)}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={e => { e.preventDefault(); onStart(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={e => { e.preventDefault(); onEnd(); }}
      >
        {/* Subtle background grid */}
        <defs>
          <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,255,136,0.04)" strokeWidth="0.5"/>
          </pattern>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="strongglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width={SIZE} height={SIZE} fill="url(#pg)" rx="12"/>

        {/* Connecting lines — glow layer */}
        {pts.length > 1 && (
          <polyline
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={lineColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.15"
            filter="url(#strongglow)"
          />
        )}
        {/* Connecting lines — sharp layer */}
        {pts.length > 1 && (
          <polyline
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
            strokeDasharray={isDrawing ? '4 3' : 'none'}
          />
        )}

        {/* Dots */}
        {dots.map(dot => {
          const active = pattern.includes(dot.index);
          const order  = pattern.indexOf(dot.index);
          const r      = active ? ACTIVE_R : DOT_R;

          return (
            <g key={dot.index}>
              {/* Outer ring — always visible */}
              <circle cx={dot.x} cy={dot.y} r={DOT_R + 6}
                fill="none"
                stroke={active ? nodeColor : 'rgba(0,255,136,0.12)'}
                strokeWidth="1"
              />

              {/* Glow halo on active */}
              {active && (
                <circle cx={dot.x} cy={dot.y} r={r + 10}
                  fill={nodeColor} opacity="0.08"
                  filter="url(#strongglow)"
                />
              )}

              {/* Core dot */}
              <circle cx={dot.x} cy={dot.y} r={r}
                fill={active ? nodeColor : DIM}
                stroke={active ? nodeColor : 'rgba(0,255,136,0.25)'}
                strokeWidth={active ? 0 : 1}
                filter={active ? 'url(#glow)' : undefined}
                style={{ transition: 'r 0.15s, fill 0.15s' }}
              />

              {/* Inner dot (inactive) */}
              {!active && (
                <circle cx={dot.x} cy={dot.y} r={3}
                  fill="rgba(0,255,136,0.5)"
                />
              )}

              {/* Order number */}
              {active && (
                <text x={dot.x} y={dot.y}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#020408" fontSize="11" fontWeight="900"
                  fontFamily="monospace"
                >
                  {order + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Status line */}
      <div className="flex items-center gap-2 h-5">
        {error ? (
          <span className="text-[10px] font-bold font-mono tracking-widest" style={{ color: ERROR }}>
            ⬡ {error}
          </span>
        ) : pattern.length > 0 && pattern.length < minDots ? (
          <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.5)' }}>
            NODES: {pattern.length}/{minDots} — CONTINUE DRAWING
          </span>
        ) : isDrawing ? (
          <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.4)' }}>
            TRACING PATTERN...
          </span>
        ) : pattern.length === 0 ? (
          <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,136,0.3)' }}>
            DRAW PATTERN TO AUTHENTICATE
          </span>
        ) : null}
      </div>
    </div>
  );
}
