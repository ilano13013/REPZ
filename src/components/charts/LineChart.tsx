/**
 * Graphique linéaire léger basé sur react-native-svg (compatible Expo, sans
 * dépendance native lourde). Lisible et animable, suffisant pour la v1.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppText } from '../ui/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface LinePoint {
  x: number; // timestamp ou index
  y: number;
}

interface LineChartProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function LineChart({ data, height = 160, color, formatValue }: LineChartProps) {
  const { colors, spacing } = useTheme();
  const stroke = color ?? colors.accent;
  const width = 320;
  const pad = 12;

  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <AppText tone="muted">Pas encore assez de données.</AppText>
      </View>
    );
  }

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const sx = (x: number) => pad + ((x - minX) / spanX) * (width - pad * 2);
  const sy = (y: number) => height - pad - ((y - minY) / spanY) * (height - pad * 2);

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(d.x)} ${sy(d.y)}`).join(' ');
  const areaPath = `${linePath} L ${sx(maxX)} ${height - pad} L ${sx(minX)} ${height - pad} Z`;

  return (
    <View style={{ gap: spacing.xs }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
            <Stop offset="1" stopColor={stroke} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={colors.border} strokeWidth={1} />
        <Path d={areaPath} fill="url(#grad)" />
        <Path d={linePath} stroke={stroke} strokeWidth={2.5} fill="none" />
        {data.map((d, i) => (
          <Circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={3} fill={stroke} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="faint">
          {formatValue ? formatValue(minY) : Math.round(minY)}
        </AppText>
        <AppText variant="caption" tone="faint">
          {formatValue ? formatValue(maxY) : Math.round(maxY)}
        </AppText>
      </View>
    </View>
  );
}
