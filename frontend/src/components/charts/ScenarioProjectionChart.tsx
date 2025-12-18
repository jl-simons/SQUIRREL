import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart';
import { ScenarioProjectionChartProps, RETRO_THEME } from './types';

/**
 * ScenarioProjectionChart
 *
 * Multi-line chart for comparing different financial scenarios/projections.
 * Shows baseline vs alternative scenarios with visual distinction for future projections.
 *
 * @example
 * <ScenarioProjectionChart
 *   series={[
 *     { name: 'Baseline', data: [...] },
 *     { name: 'Aggressive Savings', data: [...] },
 *     { name: 'Conservative', data: [...] }
 *   ]}
 *   projectionStartMonth="2024-06"
 *   highlightSeries="Baseline"
 * />
 */
const ScenarioProjectionChart: React.FC<ScenarioProjectionChartProps> = ({
  series,
  width = '100%',
  height = 400,
  loading = false,
  className = '',
  style = {},
  highlightSeries,
  enableLegendToggle = true,
  projectionStartMonth,
}) => {
  const option = useMemo<EChartsOption>(() => {
    // Extract all unique x values across all series
    const allXValues = Array.from(
      new Set(series.flatMap((s) => s.data.map((p) => p.x)))
    ).sort();

    // Find projection start index if specified
    const projectionStartIndex = projectionStartMonth
      ? allXValues.indexOf(projectionStartMonth)
      : -1;

    // Transform series data to ECharts format
    const echartsSeriesData = series.map((s, index) => {
      const isHighlighted = highlightSeries === s.name;

      // Split data into historical and projection if needed
      const historicalData: (number | null)[] = [];
      const projectionData: (number | null)[] = [];

      allXValues.forEach((x, i) => {
        const point = s.data.find((p) => p.x === x);
        const value = point ? point.y : null;

        if (projectionStartIndex !== -1 && i >= projectionStartIndex) {
          // This is projection data
          historicalData.push(null);
          projectionData.push(value);
        } else {
          // This is historical data
          historicalData.push(value);
          projectionData.push(null);
        }
      });

      const color = s.color || RETRO_THEME.colors[index % RETRO_THEME.colors.length];
      const baseConfig = {
        name: s.name,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: isHighlighted ? 10 : 6,
        itemStyle: {
          color,
          borderColor: '#330066',
          borderWidth: isHighlighted ? 3 : 2,
        },
        lineStyle: {
          width: isHighlighted ? 5 : 3,
          color,
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 4,
          },
          lineStyle: {
            width: isHighlighted ? 6 : 4,
          },
        },
      };

      // If we have projection data, create two series (historical + projection)
      if (projectionStartIndex !== -1) {
        return [
          {
            ...baseConfig,
            data: historicalData,
            showSymbol: true,
          },
          {
            ...baseConfig,
            name: `${s.name} (Projected)`,
            data: projectionData,
            lineStyle: {
              ...baseConfig.lineStyle,
              type: 'dashed',
            },
            showSymbol: false,
            // Don't show in legend (parent series already shown)
            legendHoverLink: false,
          },
        ];
      }

      // Otherwise, single series
      return {
        ...baseConfig,
        data: allXValues.map((x) => {
          const point = s.data.find((p) => p.x === x);
          return point ? point.y : null;
        }),
      };
    }).flat();

    return {
      // Tooltip
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: RETRO_THEME.colors[0],
        borderWidth: 2,
        textStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 12,
        },
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: RETRO_THEME.axisColor,
            width: 2,
            type: 'dashed',
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const month = params[0].axisValue;
          let tooltip = `<strong>${month}</strong><br/>`;

          // Filter out projection duplicates
          const uniqueParams = params.filter(
            (p: any) => !p.seriesName.includes('(Projected)')
          );

          uniqueParams.forEach((param: any) => {
            if (param.value !== null) {
              const marker = param.marker;
              const value = param.value?.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              });
              tooltip += `${marker} ${param.seriesName}: ${value}<br/>`;
            }
          });

          return tooltip;
        },
      },

      // Legend
      legend: {
        top: 10,
        right: 10,
        orient: 'vertical',
        backgroundColor: 'white',
        borderColor: RETRO_THEME.colors[0],
        borderWidth: 2,
        borderRadius: 4,
        padding: 10,
        textStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 10,
        },
        selected: enableLegendToggle
          ? undefined
          : series.reduce((acc, s) => {
              acc[s.name] = true;
              return acc;
            }, {} as Record<string, boolean>),
        // Filter out projection series from legend
        data: series.map((s) => s.name),
      },

      // Grid
      grid: {
        left: 80,
        right: 150,
        top: 60,
        bottom: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderColor: RETRO_THEME.axisColor,
        borderWidth: 3,
      },

      // X-axis
      xAxis: {
        type: 'category',
        data: allXValues,
        name: 'Month',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: RETRO_THEME.axisColor,
            width: 3,
          },
        },
        axisTick: {
          lineStyle: {
            color: RETRO_THEME.axisColor,
            width: 2,
          },
        },
        axisLabel: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 11,
          rotate: allXValues.length > 12 ? 45 : 0,
          interval: allXValues.length > 24 ? Math.ceil(allXValues.length / 12) - 1 : 0,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: RETRO_THEME.gridColor,
            width: 1,
          },
        },
      },

      // Y-axis
      yAxis: {
        type: 'value',
        name: 'Balance ($)',
        nameLocation: 'middle',
        nameGap: 60,
        nameTextStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: RETRO_THEME.axisColor,
            width: 3,
          },
        },
        axisTick: {
          lineStyle: {
            color: RETRO_THEME.axisColor,
            width: 2,
          },
        },
        axisLabel: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 11,
          formatter: (value: number) => {
            return value >= 1000 || value <= -1000
              ? `$${(value / 1000).toFixed(1)}k`
              : `$${value}`;
          },
        },
        splitLine: {
          lineStyle: {
            color: RETRO_THEME.gridColor,
            width: 1,
            type: 'dashed',
          },
        },
      },

      // Mark projection start with vertical line
      ...(projectionStartIndex !== -1 && {
        series: [
          ...echartsSeriesData,
          {
            name: 'Projection Start',
            type: 'line',
            markLine: {
              symbol: 'none',
              silent: true,
              lineStyle: {
                color: RETRO_THEME.colors[2], // yellow
                width: 3,
                type: 'solid',
              },
              label: {
                show: true,
                position: 'insideEndTop',
                formatter: 'Projection →',
                color: RETRO_THEME.textColor,
                fontWeight: 'bold',
                fontSize: 11,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: 4,
                borderColor: RETRO_THEME.colors[2],
                borderWidth: 2,
                borderRadius: 4,
              },
              data: [
                {
                  xAxis: projectionStartMonth,
                },
              ],
            },
          },
        ],
      }),

      // Series data
      series: echartsSeriesData,

      // Animation
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [series, highlightSeries, enableLegendToggle, projectionStartMonth]);

  return (
    <BaseChart
      option={option}
      width={width}
      height={height}
      loading={loading}
      className={className}
      style={style}
    />
  );
};

export default ScenarioProjectionChart;
