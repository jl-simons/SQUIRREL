import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { BalanceOverTimeChartProps, RETRO_THEME } from './types';

/**
 * BalanceOverTimeChart
 *
 * Line chart showing balance trends over time with retro aesthetic.
 * Uses Apache ECharts for rendering while maintaining the original visual style.
 *
 * @example
 * <BalanceOverTimeChart
 *   series={[
 *     { name: 'Balance', data: [{ x: '2024-01', y: 1000 }, { x: '2024-02', y: 1200 }] }
 *   ]}
 *   height={300}
 * />
 */
const BalanceOverTimeChart: React.FC<BalanceOverTimeChartProps> = ({
  series,
  width = '100%',
  height = 300,
  loading = false,
  yAxisLabel = 'Balance',
  xAxisLabel = 'Month',
  enableZoom = false,
  className = '',
  style = {},
}) => {
  const option = useMemo<EChartsOption>(() => {
    // Extract all unique x values across all series
    const allXValues = Array.from(
      new Set(series.flatMap((s) => s.data.map((p) => p.x)))
    ).sort();

    // Transform series data to ECharts format
    const echartsSeriesData = series.map((s, index) => ({
      name: s.name,
      type: 'line' as const,
      smooth: false,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: s.color || RETRO_THEME.colors[index % RETRO_THEME.colors.length],
        borderColor: '#330066',
        borderWidth: 3,
      },
      lineStyle: {
        width: 4,
        color: s.color || RETRO_THEME.colors[index % RETRO_THEME.colors.length],
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
      data: allXValues.map((x) => {
        const point = s.data.find((p) => p.x === x);
        return point ? point.y : null;
      }),
    }));

    return {
      // Retro gradient background
      backgroundColor: 'transparent', // Set via container CSS

      // Color palette
      color: RETRO_THEME.colors,

      // Grid configuration - retro style
      grid: {
        left: 60,
        right: 150,
        top: 60,
        bottom: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderColor: RETRO_THEME.axisColor,
        borderWidth: 3,
      },

      // Tooltip configuration
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
      },

      // Legend configuration - retro style
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
        itemWidth: 20,
        itemHeight: 10,
      },

      // X-axis configuration
      xAxis: {
        type: 'category',
        data: allXValues,
        name: xAxisLabel,
        nameLocation: 'middle',
        nameGap: 35,
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
          interval: allXValues.length > 24 ? Math.ceil(allXValues.length / 12) - 1 : allXValues.length > 12 ? 1 : 0,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: RETRO_THEME.gridColor,
            width: 1,
          },
        },
      },

      // Y-axis configuration
      yAxis: {
        type: 'value',
        name: yAxisLabel,
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
          backgroundColor: 'white',
          borderColor: RETRO_THEME.colors[0],
          borderWidth: 2,
          borderRadius: 4,
          padding: [4, 8],
        },
        splitLine: {
          lineStyle: {
            color: RETRO_THEME.gridColor,
            width: 1,
            type: 'dashed',
          },
        },
      },

      // Data zoom (optional)
      ...(enableZoom && {
        dataZoom: [
          {
            type: 'slider',
            show: true,
            start: 0,
            end: 100,
            borderColor: RETRO_THEME.axisColor,
            borderWidth: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            dataBackground: {
              lineStyle: { color: RETRO_THEME.colors[0] },
              areaStyle: { color: RETRO_THEME.colors[0], opacity: 0.2 },
            },
          },
          {
            type: 'inside',
            start: 0,
            end: 100,
          },
        ],
      }),

      // Series data
      series: echartsSeriesData,

      // Animation
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
    };
  }, [series, yAxisLabel, xAxisLabel, enableZoom]);

  return (
    <div
      className={`retro-chart-container ${className}`}
      style={{
        background: RETRO_THEME.backgroundColor,
        borderRadius: '8px',
        padding: '8px',
        ...style,
      }}
    >
      <ReactECharts
        option={option}
        style={{ width, height }}
        showLoading={loading}
        loadingOption={{
          text: 'Loading...',
          color: RETRO_THEME.colors[0],
          textColor: RETRO_THEME.textColor,
          maskColor: 'rgba(255, 255, 255, 0.8)',
          zlevel: 0,
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default BalanceOverTimeChart;
