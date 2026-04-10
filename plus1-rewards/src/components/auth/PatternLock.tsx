// plus1-rewards/src/components/auth/PatternLock.tsx
import { useState, useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
  index: number;
}

interface PatternLockProps {
  onPatternComplete: (pattern: number[]) => void;
  gridSize?: number;
  minDots?: number;
  disabled?: boolean;
  error?: string;
}

export default function PatternLock({ 
  onPatternComplete, 
  gridSize = 4, 
  minDots = 4,
  disabled = false,
  error = ''
}: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dots, setDots] = useState<Point[]>([]);

  const DOT_RADIUS = 12;
  const ACTIVE_DOT_RADIUS = 16;
  const GRID_PADDING = 60;
  const SVG_SIZE = 320;

  useEffect(() => {
    // Calculate dot positions
    const spacing = (SVG_SIZE - 2 * GRID_PADDING) / (gridSize - 1);
    const newDots: Point[] = [];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        newDots.push({
          x: GRID_PADDING + col * spacing,
          y: GRID_PADDING + row * spacing,
          index: row * gridSize + col
        });
      }
    }
    
    setDots(newDots);
  }, [gridSize]);

  const getIntermediateDot = (a: number, c: number): number | null => {
    const r1 = Math.floor(a / gridSize);
    const c1 = a % gridSize;
    const r2 = Math.floor(c / gridSize);
    const c2 = c % gridSize;
    const dr = r2 - r1;
    const dc = c2 - c1;

    // Only if both deltas are even (midpoint is integer)
    if (dr % 2 === 0 && dc % 2 === 0) {
      const mr = r1 + dr / 2;
      const mc = c1 + dc / 2;
      const mid = mr * gridSize + mc;
      if (mid !== a && mid !== c) return mid;
    }
    return null;
  };

  const addDotToPattern = (dotIndex: number) => {
    if (pattern.includes(dotIndex)) return;

    const newPattern = [...pattern];

    // Check for intermediate dot
    if (newPattern.length > 0) {
      const lastDot = newPattern[newPattern.length - 1];
      const intermediateDot = getIntermediateDot(lastDot, dotIndex);
      
      if (intermediateDot !== null && !newPattern.includes(intermediateDot)) {
        newPattern.push(intermediateDot);
      }
    }

    newPattern.push(dotIndex);
    setPattern(newPattern);
  };

  const getDotAtPosition = (x: number, y: number): number | null => {
    if (!svgRef.current) return null;

    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((x - rect.left) / rect.width) * SVG_SIZE;
    const svgY = ((y - rect.top) / rect.height) * SVG_SIZE;

    for (const dot of dots) {
      const distance = Math.sqrt(
        Math.pow(svgX - dot.x, 2) + Math.pow(svgY - dot.y, 2)
      );
      if (distance <= ACTIVE_DOT_RADIUS * 1.5) {
        return dot.index;
      }
    }
    return null;
  };

  const handleStart = (x: number, y: number) => {
    if (disabled) return;
    
    const dotIndex = getDotAtPosition(x, y);
    if (dotIndex !== null) {
      setIsDrawing(true);
      setPattern([dotIndex]);
      setCurrentPos({ x, y });
    }
  };

  const handleMove = (x: number, y: number) => {
    if (!isDrawing || disabled) return;

    setCurrentPos({ x, y });

    const dotIndex = getDotAtPosition(x, y);
    if (dotIndex !== null && !pattern.includes(dotIndex)) {
      addDotToPattern(dotIndex);
    }
  };

  const handleEnd = () => {
    if (!isDrawing || disabled) return;

    setIsDrawing(false);
    setCurrentPos(null);

    if (pattern.length >= minDots) {
      onPatternComplete(pattern);
    } else {
      // Pattern too short, reset
      setTimeout(() => setPattern([]), 300);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  const getLinePoints = () => {
    if (pattern.length === 0) return [];

    const points: { x: number; y: number }[] = [];
    
    for (const dotIndex of pattern) {
      const dot = dots.find(d => d.index === dotIndex);
      if (dot) {
        if (!svgRef.current) continue;
        const rect = svgRef.current.getBoundingClientRect();
        points.push({ x: dot.x, y: dot.y });
      }
    }

    // Add current finger position if drawing
    if (isDrawing && currentPos && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((currentPos.x - rect.left) / rect.width) * SVG_SIZE;
      const svgY = ((currentPos.y - rect.top) / rect.height) * SVG_SIZE;
      points.push({ x: svgX, y: svgY });
    }

    return points;
  };

  const linePoints = getLinePoints();

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="touch-none select-none bg-gray-50 rounded-2xl border-2 border-gray-200"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {/* Draw connecting lines */}
        {linePoints.length > 1 && (
          <polyline
            points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        )}

        {/* Draw dots */}
        {dots.map((dot) => {
          const isActive = pattern.includes(dot.index);
          const order = pattern.indexOf(dot.index);

          return (
            <g key={dot.index}>
              {/* Glow effect for active dots */}
              {isActive && (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={ACTIVE_DOT_RADIUS + 8}
                  fill="hsl(142, 71%, 45%)"
                  opacity="0.2"
                  className="animate-pulse"
                />
              )}
              
              {/* Main dot */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={isActive ? ACTIVE_DOT_RADIUS : DOT_RADIUS}
                fill={isActive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 0%, 80%)'}
                stroke={isActive ? 'hsl(142, 71%, 35%)' : 'hsl(0, 0%, 70%)'}
                strokeWidth="2"
                className="transition-all duration-200"
              />

              {/* Order number */}
              {isActive && (
                <text
                  x={dot.x}
                  y={dot.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {order + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Instructions */}
      <div className="text-center space-y-2">
        {error ? (
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        ) : pattern.length > 0 && pattern.length < minDots ? (
          <p className="text-sm text-orange-600 font-medium">
            Connect at least {minDots} dots ({pattern.length}/{minDots})
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            {isDrawing ? 'Keep drawing...' : 'Draw your pattern to unlock'}
          </p>
        )}
      </div>
    </div>
  );
}
