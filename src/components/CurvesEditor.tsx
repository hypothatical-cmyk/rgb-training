import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RGB } from '../types/color';

export type CurveChannel = 'rgb' | 'red' | 'green' | 'blue';

export interface CurvePoint {
  id: string;
  x: number; // 0 ~ 255 (Input)
  y: number; // 0 ~ 255 (Output)
}

export interface CurvesState {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export const INITIAL_CURVES_STATE: CurvesState = {
  rgb: [
    { id: 'start', x: 0, y: 0 },
    { id: 'mid', x: 128, y: 128 },
    { id: 'end', x: 255, y: 255 },
  ],
  red: [
    { id: 'start', x: 0, y: 0 },
    { id: 'mid', x: 128, y: 128 },
    { id: 'end', x: 255, y: 255 },
  ],
  green: [
    { id: 'start', x: 0, y: 0 },
    { id: 'mid', x: 128, y: 128 },
    { id: 'end', x: 255, y: 255 },
  ],
  blue: [
    { id: 'start', x: 0, y: 0 },
    { id: 'mid', x: 128, y: 128 },
    { id: 'end', x: 255, y: 255 },
  ],
};

/**
 * Generate 256-entry lookup table (LUT) from sorted control points using smooth monotonic interpolation
 */
export function buildLut(points: CurvePoint[]): Uint8Array {
  const lut = new Uint8Array(256);
  const sorted = [...points].sort((a, b) => a.x - b.x);

  if (sorted.length === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Linear / Monotonic segments for clean Photoshop-accurate response
  for (let i = 0; i < 256; i++) {
    if (i <= sorted[0].x) {
      lut[i] = Math.max(0, Math.min(255, Math.round(sorted[0].y)));
      continue;
    }
    if (i >= sorted[sorted.length - 1].x) {
      lut[i] = Math.max(0, Math.min(255, Math.round(sorted[sorted.length - 1].y)));
      continue;
    }

    // Find bounding points
    let idx = 0;
    while (idx < sorted.length - 1 && sorted[idx + 1].x < i) {
      idx++;
    }

    const p0 = sorted[Math.max(0, idx - 1)];
    const p1 = sorted[idx];
    const p2 = sorted[idx + 1];
    const p3 = sorted[Math.min(sorted.length - 1, idx + 2)];

    // Catmull-Rom or cubic hermite spline
    const t = (i - p1.x) / (p2.x - p1.x || 1);
    const t2 = t * t;
    const t3 = t2 * t;

    // Catmull-Rom formula
    const val =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    lut[i] = Math.max(0, Math.min(255, Math.round(val)));
  }

  return lut;
}

/**
 * Apply 4-channel Curves state to an RGB pixel
 */
export function applyCurvesToRgb(rgb: RGB, state: CurvesState): RGB {
  const lutRgb = buildLut(state.rgb);
  const lutR = buildLut(state.red);
  const lutG = buildLut(state.green);
  const lutB = buildLut(state.blue);

  // Apply individual channel LUTs first, then composite RGB master LUT
  const rAfter = lutRgb[lutR[rgb.r]];
  const gAfter = lutRgb[lutG[rgb.g]];
  const bAfter = lutRgb[lutB[rgb.b]];

  return { r: rAfter, g: gAfter, b: bAfter };
}

interface CurvesEditorProps {
  curves: CurvesState;
  onChange: (newCurves: CurvesState) => void;
  activeChannel?: CurveChannel;
  onActiveChannelChange?: (channel: CurveChannel) => void;
  referenceCast?: RGB;
}

export const CurvesEditor: React.FC<CurvesEditorProps> = ({
  curves,
  onChange,
  activeChannel = 'rgb',
  onActiveChannelChange,
  referenceCast,
}) => {
  const [channel, setChannel] = useState<CurveChannel>(activeChannel);
  const [selectedPointId, setSelectedPointId] = useState<string>('mid');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (activeChannel) setChannel(activeChannel);
  }, [activeChannel]);

  const handleChannelSelect = (ch: CurveChannel) => {
    setChannel(ch);
    setSelectedPointId('mid');
    onActiveChannelChange?.(ch);
  };

  const points = curves[channel];
  const selectedPoint = points.find((p) => p.id === selectedPointId) || points[1] || points[0];

  // SVG coordinate transformation: Input X goes 0 -> 255 (left to right)
  // Output Y goes 0 -> 255 (bottom to top, so SVG y is 255 - Y)
  const toSvgX = (x: number) => x;
  const toSvgY = (y: number) => 255 - y;
  const fromSvgX = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  const fromSvgY = (y: number) => Math.max(0, Math.min(255, Math.round(255 - y)));

  const handlePointerDown = (pointId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelectedPointId(pointId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 255;
    const rawY = ((e.clientY - rect.top) / rect.height) * 255;

    const newX = fromSvgX(rawX);
    const newY = fromSvgY(rawY);

    const updatedPoints = points.map((p) => {
      if (p.id !== selectedPointId) return p;
      // Anchor boundary points x constraint
      if (p.id === 'start') return { ...p, y: newY };
      if (p.id === 'end') return { ...p, y: newY };
      return { ...p, x: newX, y: newY };
    });

    onChange({
      ...curves,
      [channel]: updatedPoints,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSelectedPointValues = (newX?: number, newY?: number) => {
    if (!selectedPoint) return;
    const updatedPoints = points.map((p) => {
      if (p.id !== selectedPoint.id) return p;
      return {
        ...p,
        x: newX !== undefined ? Math.max(0, Math.min(255, newX)) : p.x,
        y: newY !== undefined ? Math.max(0, Math.min(255, newY)) : p.y,
      };
    });
    onChange({
      ...curves,
      [channel]: updatedPoints,
    });
  };

  const resetCurrentChannel = () => {
    onChange({
      ...curves,
      [channel]: [
        { id: 'start', x: 0, y: 0 },
        { id: 'mid', x: 128, y: 128 },
        { id: 'end', x: 255, y: 255 },
      ],
    });
    setSelectedPointId('mid');
  };

  const resetAllChannels = () => {
    onChange(INITIAL_CURVES_STATE);
    setSelectedPointId('mid');
  };

  // Build SVG path string for current channel's curve
  const currentLut = buildLut(points);
  let pathD = `M 0 ${toSvgY(currentLut[0])}`;
  for (let i = 1; i < 256; i += 2) {
    pathD += ` L ${i} ${toSvgY(currentLut[i])}`;
  }
  pathD += ` L 255 ${toSvgY(currentLut[255])}`;

  // Channel color configs
  const channelColors = {
    rgb: { stroke: '#ffffff', fill: 'rgba(255,255,255,0.15)', name: 'RGB 전체', badge: 'bg-slate-700 text-white' },
    red: { stroke: '#ef4444', fill: 'rgba(239,68,68,0.15)', name: 'Red (Cyan ↔ Red)', badge: 'bg-red-900/60 text-red-200' },
    green: { stroke: '#22c55e', fill: 'rgba(34,197,94,0.15)', name: 'Green (Magenta ↔ Green)', badge: 'bg-green-900/60 text-green-200' },
    blue: { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.15)', name: 'Blue (Yellow ↔ Blue)', badge: 'bg-blue-900/60 text-blue-200' },
  };

  const complementaryLabels = {
    rgb: { top: '밝게 (Highlights)', bottom: '어둡게 (Shadows)' },
    red: { top: '+ Red (적색 추가)', bottom: '- Red / + Cyan (청록 추가)' },
    green: { top: '+ Green (녹색 추가)', bottom: '- Green / + Magenta (자홍 추가)' },
    blue: { top: '+ Blue (청색 추가)', bottom: '- Blue / + Yellow (황색 추가)' },
  };

  return (
    <div className="bg-[#181a1f] border border-[#2a2f3a] rounded-xl p-4 flex flex-col gap-3 shadow-lg select-none">
      {/* Header & Channel Selector */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2a2f3a] pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-300">Channel:</span>
          <div className="inline-flex rounded-lg bg-[#111216] p-0.5 border border-[#2a2f3a]">
            {(['rgb', 'red', 'green', 'blue'] as CurveChannel[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => handleChannelSelect(ch)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  channel === ch
                    ? ch === 'red'
                      ? 'bg-red-600 text-white shadow-sm'
                      : ch === 'green'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : ch === 'blue'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ch.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCurrentChannel}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded border border-[#2a2f3a] bg-[#1f2229] hover:bg-[#282d37] transition-colors"
            title="현재 채널 곡선 초기화"
          >
            채널 초기화
          </button>
          <button
            type="button"
            onClick={resetAllChannels}
            className="text-[11px] text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded border border-amber-900/40 bg-amber-950/20 hover:bg-amber-900/30 transition-colors"
            title="모든 채널 곡선 전체 초기화"
          >
            전체 초기화
          </button>
        </div>
      </div>

      {/* Main Coordinate Grid & Curve */}
      <div className="relative flex flex-col gap-1">
        {/* Top Direction Indicator (Photoshop Complementary Guidance) */}
        <div className="flex items-center justify-between text-[11px] font-medium px-1">
          <span className="text-slate-400">출력 (Output)</span>
          <span className={`${channel === 'red' ? 'text-red-400' : channel === 'green' ? 'text-emerald-400' : channel === 'blue' ? 'text-blue-400' : 'text-slate-300'}`}>
            ▲ {complementaryLabels[channel].top}
          </span>
        </div>

        <div className="relative w-full aspect-square bg-[#0e1014] rounded-lg border border-[#2d3340] overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 255 255"
            className="w-full h-full cursor-crosshair touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Subtle Grid Lines (Photoshop 4x4 quarter grid) */}
            <defs>
              <pattern id="grid" width="63.75" height="63.75" patternUnits="userSpaceOnUse">
                <path d="M 63.75 0 L 0 0 0 63.75" fill="none" stroke="#1f242e" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="255" height="255" fill="#0e1014" />
            <rect width="255" height="255" fill="url(#grid)" />

            {/* Diagonal Baseline (y = x identity line) */}
            <line x1="0" y1="255" x2="255" y2="0" stroke="#2c3342" strokeDasharray="3 3" strokeWidth="1" />

            {/* Reference vertical line if referenceCast is present */}
            {referenceCast && (() => {
              const chKey: keyof RGB = channel === 'green' ? 'g' : channel === 'blue' ? 'b' : 'r';
              return (
                <line
                  x1={referenceCast[chKey]}
                  y1="0"
                  x2={referenceCast[chKey]}
                  y2="255"
                  stroke="#6366f1"
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
              );
            })()}

            {/* Passive Other Channel Curves */}
            {(['red', 'green', 'blue'] as CurveChannel[]).map((ch) => {
              if (ch === channel) return null;
              const chLut = buildLut(curves[ch]);
              let otherPath = `M 0 ${toSvgY(chLut[0])}`;
              for (let i = 2; i < 256; i += 4) {
                otherPath += ` L ${i} ${toSvgY(chLut[i])}`;
              }
              otherPath += ` L 255 ${toSvgY(chLut[255])}`;
              return (
                <path
                  key={ch}
                  d={otherPath}
                  fill="none"
                  stroke={channelColors[ch].stroke}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
              );
            })}

            {/* Active Channel Curve */}
            <path
              d={pathD}
              fill="none"
              stroke={channelColors[channel].stroke}
              strokeWidth="2.2"
              className="transition-all"
            />

            {/* Interactive Control Points */}
            {points.map((p) => {
              const isSelected = p.id === selectedPointId;
              const svgX = toSvgX(p.x);
              const svgY = toSvgY(p.y);
              return (
                <g key={p.id}>
                  {/* Outer glow on selected */}
                  {isSelected && (
                    <circle
                      cx={svgX}
                      cy={svgY}
                      r="9"
                      fill="none"
                      stroke={channelColors[channel].stroke}
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={isSelected ? '6' : '4.5'}
                    fill={isSelected ? '#ffffff' : channelColors[channel].stroke}
                    stroke="#0e1014"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(p.id, e)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Direction Indicator (Photoshop Complementary Guidance) */}
        <div className="flex items-center justify-between text-[11px] font-medium px-1">
          <span className="text-slate-400">입력 (Input)</span>
          <span className={`${channel === 'red' ? 'text-cyan-400' : channel === 'green' ? 'text-pink-400' : channel === 'blue' ? 'text-yellow-400' : 'text-slate-400'}`}>
            ▼ {complementaryLabels[channel].bottom}
          </span>
        </div>
      </div>

      {/* Numerical Inputs (Input X & Output Y like Photoshop Curves) */}
      <div className="grid grid-cols-2 gap-3 bg-[#111317] p-2.5 rounded-lg border border-[#242933]">
        <div className="flex items-center justify-between gap-1.5">
          <label className="text-xs font-medium text-slate-400">Input (X):</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="255"
              value={selectedPoint ? selectedPoint.x : 128}
              disabled={selectedPoint?.id === 'start' || selectedPoint?.id === 'end'}
              onChange={(e) => updateSelectedPointValues(Number(e.target.value), undefined)}
              className="w-14 bg-[#181b22] border border-[#2d3340] rounded px-1.5 py-0.5 text-xs font-mono text-center text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5">
          <label className="text-xs font-medium text-slate-400">Output (Y):</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="255"
              value={selectedPoint ? selectedPoint.y : 128}
              onChange={(e) => updateSelectedPointValues(undefined, Number(e.target.value))}
              className="w-14 bg-[#181b22] border border-[#2d3340] rounded px-1.5 py-0.5 text-xs font-mono text-center text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Presets */}
      <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
        <span className="text-slate-500 py-1">퀵 커브:</span>
        <button
          type="button"
          onClick={() => {
            // S-Curve (High Contrast)
            onChange({
              ...curves,
              [channel]: [
                { id: 'start', x: 0, y: 0 },
                { id: 'mid', x: 128, y: 128 },
                { id: 'end', x: 255, y: 255 },
              ],
            });
          }}
          className="px-2 py-0.5 rounded bg-[#1f232b] hover:bg-[#2b303c] text-slate-300 transition-colors"
        >
          직선 (Linear)
        </button>
        <button
          type="button"
          onClick={() => {
            // Lift midtone
            onChange({
              ...curves,
              [channel]: [
                { id: 'start', x: 0, y: 0 },
                { id: 'mid', x: 128, y: 165 },
                { id: 'end', x: 255, y: 255 },
              ],
            });
          }}
          className="px-2 py-0.5 rounded bg-[#1f232b] hover:bg-[#2b303c] text-slate-300 transition-colors"
        >
          +미드톤 증폭 (+37)
        </button>
        <button
          type="button"
          onClick={() => {
            // Suppress midtone
            onChange({
              ...curves,
              [channel]: [
                { id: 'start', x: 0, y: 0 },
                { id: 'mid', x: 128, y: 91 },
                { id: 'end', x: 255, y: 255 },
              ],
            });
          }}
          className="px-2 py-0.5 rounded bg-[#1f232b] hover:bg-[#2b303c] text-slate-300 transition-colors"
        >
          -미드톤 감쇄 (-37)
        </button>
      </div>
    </div>
  );
};
