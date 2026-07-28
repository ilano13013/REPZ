/**
 * Radar (toile d'araignée) en react-native-svg.
 *
 * Utilisé pour la fiche de personnage (caractéristiques) et, en option, pour
 * visualiser les niveaux musculaires. Chaque axe est normalisé sur [0, max].
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

export interface RadarAxis {
  label: string;
  value: number;
}

interface RadarChartProps {
  axes: RadarAxis[];
  max?: number;
  size?: number;
  color?: string;
}

export function RadarChart({ axes, max = 100, size = 260, color }: RadarChartProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.accent;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34; // marge pour les libellés
  const n = axes.length;
  if (n < 3) return <View style={{ height: size }} />;

  // Angle de départ en haut (-90°).
  const pointAt = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  };

  // Grilles concentriques (25/50/75/100 %).
  const rings = [0.25, 0.5, 0.75, 1];
  const ringPolys = rings.map((ring) =>
    axes.map((_, i) => {
      const p = pointAt(i, radius * ring);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' '),
  );

  // Polygone des valeurs.
  const valuePoly = axes
    .map((a, i) => {
      const ratio = Math.max(0, Math.min(1, a.value / max));
      const p = pointAt(i, radius * ratio);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {ringPolys.map((poly, i) => (
          <Polygon key={i} points={poly} fill="none" stroke={colors.border} strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const p = pointAt(i, radius);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />;
        })}
        <Polygon points={valuePoly} fill={stroke} fillOpacity={0.25} stroke={stroke} strokeWidth={2} />
        {axes.map((a, i) => {
          const ratio = Math.max(0, Math.min(1, a.value / max));
          const p = pointAt(i, radius * ratio);
          return <Circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />;
        })}
        {axes.map((a, i) => {
          const p = pointAt(i, radius + 16);
          return (
            <SvgText
              key={i}
              x={p.x}
              y={p.y}
              fill={colors.textMuted}
              fontSize={10}
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {a.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
