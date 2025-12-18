import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart';
import { CategoryBreakdownChartProps, RETRO_THEME } from './types';

/**
 * CategoryBreakdownChart
 *
 * Pie or donut chart showing category breakdown with retro aesthetic.
 * Features bold colors, clear labels, and interactive hover effects.
 *
 * @example
 * <CategoryBreakdownChart
 *   data={[
 *     { category: 'Food', amount: 1200 },
 *     { category: 'Housing', amount: 2500 },
 *     { category: 'Transport', amount: 800 }
 *   ]}
 *   donut={true}
 *   showPercentage={true}
 * />
 */
const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data,
  width = '100%',
  height = 400,
  loading = false,
  className = '',
  style = {},
  donut = true,
  innerRadiusPercent = 40,
  showPercentage = true,
}) => {
  const option = useMemo<EChartsOption>(() => {
    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    // Transform data to ECharts format
    const pieData = data.map((item, index) => ({
      name: item.category,
      value: item.amount,
      itemStyle: {
        color: RETRO_THEME.colors[index % RETRO_THEME.colors.length],
        borderColor: RETRO_THEME.axisColor,
        borderWidth: 3,
      },
    }));

    return {
      // Tooltip
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percentage = ((params.value / total) * 100).toFixed(1);
          const value = params.value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          return `<strong>${params.name}</strong><br/>
                  ${params.marker} Amount: ${value}<br/>
                  Percentage: ${percentage}%`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: RETRO_THEME.colors[0],
        borderWidth: 2,
        textStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 12,
        },
      },

      // Legend
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        backgroundColor: 'white',
        borderColor: RETRO_THEME.colors[0],
        borderWidth: 2,
        borderRadius: 4,
        padding: 10,
        textStyle: {
          color: RETRO_THEME.textColor,
          fontWeight: 'bold',
          fontSize: 11,
        },
        formatter: (name: string) => {
          const item = data.find((d) => d.category === name);
          if (!item) return name;

          const percentage = ((item.amount / total) * 100).toFixed(1);
          return `${name} (${percentage}%)`;
        },
      },

      // Series
      series: [
        {
          name: 'Category Breakdown',
          type: 'pie',
          radius: donut ? [`${innerRadiusPercent}%`, '70%'] : '70%',
          center: ['40%', '50%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          label: {
            show: true,
            position: 'outside',
            color: RETRO_THEME.textColor,
            fontWeight: 'bold',
            fontSize: 11,
            formatter: (params: any) => {
              if (showPercentage) {
                const percentage = ((params.value / total) * 100).toFixed(1);
                return `{name|${params.name}}\n{percent|${percentage}%}`;
              }
              return params.name;
            },
            rich: {
              name: {
                fontSize: 11,
                fontWeight: 'bold',
                color: RETRO_THEME.textColor,
              },
              percent: {
                fontSize: 10,
                fontWeight: 'bold',
                color: RETRO_THEME.colors[0],
              },
            },
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            lineStyle: {
              color: RETRO_THEME.axisColor,
              width: 2,
            },
          },
          // Retro animation
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 50,
        },
      ],

      // Center text for donut chart
      ...(donut && {
        graphic: [
          {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
              text: 'Total',
              fontSize: 14,
              fontWeight: 'bold',
              fill: RETRO_THEME.textColor,
              textAlign: 'center',
            },
            z: 100,
          },
          {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
              text: total.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              }),
              fontSize: 20,
              fontWeight: 'bold',
              fill: RETRO_THEME.colors[0],
              textAlign: 'center',
              y: 20,
            },
            z: 100,
          },
        ],
      }),
    };
  }, [data, donut, innerRadiusPercent, showPercentage]);

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

export default CategoryBreakdownChart;
