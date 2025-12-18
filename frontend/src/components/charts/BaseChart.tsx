import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { BaseChartProps, RETRO_THEME } from './types';

/**
 * BaseChart Component
 *
 * Reusable wrapper for Apache ECharts with retro aesthetic theming.
 * Provides consistent styling, loading states, and responsive behavior.
 *
 * @example
 * <BaseChart
 *   option={echartsOption}
 *   height={300}
 *   loading={isLoading}
 * />
 */

interface BaseChartComponentProps extends BaseChartProps {
  /** ECharts option configuration object */
  option: EChartsOption;
  /** Callback when chart is ready */
  onChartReady?: (chartInstance: any) => void;
  /** Callback for chart events */
  onEvents?: Record<string, (params: any) => void>;
  /** Enable responsive resize (default: true) */
  autoResize?: boolean;
}

const BaseChart: React.FC<BaseChartComponentProps> = ({
  option,
  width = '100%',
  height = 300,
  loading = false,
  className = '',
  style = {},
  onChartReady,
  onEvents,
  autoResize = true,
}) => {
  // Merge user options with retro theme defaults
  const enhancedOption = useMemo<EChartsOption>(() => {
    return {
      // Set default background to transparent (handled by container)
      backgroundColor: 'transparent',

      // Color palette from retro theme
      color: RETRO_THEME.colors,

      // Default text style
      textStyle: {
        fontFamily: RETRO_THEME.fontFamily,
        color: RETRO_THEME.textColor,
        fontWeight: 'bold',
      },

      // Default tooltip style
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: RETRO_THEME.colors[0],
        borderWidth: 2,
        textStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 12,
        },
        ...option.tooltip,
      },

      // Default legend style
      legend: {
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
        ...option.legend,
      },

      // Default grid style
      grid: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderColor: RETRO_THEME.axisColor,
        borderWidth: 3,
        left: 60,
        right: 40,
        top: 60,
        bottom: 60,
        ...option.grid,
      },

      // Animation settings
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',

      // Merge rest of user options
      ...option,
    };
  }, [option]);

  return (
    <div
      className={`retro-chart-container ${className}`}
      style={{
        background: RETRO_THEME.backgroundColor,
        borderRadius: 'var(--radius-lg, 12px)',
        padding: 'var(--space-md, 1rem)',
        border: '3px ridge var(--primary-color, #9966ff)',
        boxShadow: 'var(--shadow-retro-md)',
        position: 'relative',
        ...style,
      }}
    >
      <ReactECharts
        option={enhancedOption}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
        showLoading={loading}
        loadingOption={{
          text: 'Loading Chart...',
          color: RETRO_THEME.colors[0],
          textColor: RETRO_THEME.textColor,
          maskColor: 'rgba(255, 255, 255, 0.8)',
          zlevel: 0,
          fontSize: 14,
          fontWeight: 'bold',
          fontFamily: RETRO_THEME.fontFamily,
        }}
        notMerge={true}
        lazyUpdate={true}
        onChartReady={onChartReady}
        onEvents={onEvents}
        opts={{
          renderer: 'canvas', // 'canvas' is faster, 'svg' is more crisp
          locale: 'EN',
        }}
        // Auto resize on window resize
        {...(autoResize && { style: { width, height } })}
      />
    </div>
  );
};

export default BaseChart;
