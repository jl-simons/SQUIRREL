import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart';
import { MonthlyIncomeExpenseChartProps, RETRO_THEME } from './types';

/**
 * MonthlyIncomeExpenseChart
 *
 * Bar chart showing monthly income vs expenses with retro aesthetic.
 * Supports grouped or stacked bar display with optional value labels.
 *
 * @example
 * <MonthlyIncomeExpenseChart
 *   data={[
 *     { month: '2024-01', income: 5000, expense: 3500, net: 1500 },
 *     { month: '2024-02', income: 5200, expense: 3800, net: 1400 }
 *   ]}
 *   showValues={true}
 *   height={400}
 * />
 */
const MonthlyIncomeExpenseChart: React.FC<MonthlyIncomeExpenseChartProps> = ({
  data,
  width = '100%',
  height = 400,
  loading = false,
  className = '',
  style = {},
  showValues = false,
  stacked = false,
}) => {
  const option = useMemo<EChartsOption>(() => {
    // Extract months for x-axis
    const months = data.map((d) => d.month);

    // Extract values for each series
    const incomeData = data.map((d) => d.income);
    const expenseData = data.map((d) => d.expense);
    const netData = data.map((d) => d.net);

    return {
      // Tooltip configuration
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(153, 102, 255, 0.15)',
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';

          const month = params[0].axisValue;
          let tooltip = `<strong>${month}</strong><br/>`;

          params.forEach((param: any) => {
            const marker = param.marker;
            const value = param.value?.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            });
            tooltip += `${marker} ${param.seriesName}: ${value}<br/>`;
          });

          return tooltip;
        },
      },

      // Legend
      legend: {
        data: ['Income', 'Expense', 'Net'],
        top: 10,
        right: 10,
      },

      // Grid
      grid: {
        left: 80,
        right: 40,
        top: 60,
        bottom: 80,
        containLabel: true,
      },

      // X-axis
      xAxis: {
        type: 'category',
        data: months,
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
          rotate: months.length > 12 ? 45 : 0,
          interval: months.length > 24 ? Math.ceil(months.length / 12) - 1 : 0,
        },
      },

      // Y-axis
      yAxis: {
        type: 'value',
        name: 'Amount ($)',
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
            return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
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

      // Series data
      series: [
        {
          name: 'Income',
          type: 'bar',
          stack: stacked ? 'total' : undefined,
          data: incomeData,
          itemStyle: {
            color: RETRO_THEME.colors[4], // mint green
            borderColor: RETRO_THEME.axisColor,
            borderWidth: 2,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          label: {
            show: showValues,
            position: 'top',
            color: RETRO_THEME.textColor,
            fontWeight: 'bold',
            fontSize: 10,
            formatter: (params: any) => {
              return params.value >= 1000
                ? `$${(params.value / 1000).toFixed(1)}k`
                : `$${params.value}`;
            },
          },
        },
        {
          name: 'Expense',
          type: 'bar',
          stack: stacked ? 'total' : undefined,
          data: expenseData,
          itemStyle: {
            color: RETRO_THEME.colors[5], // hot pink/red
            borderColor: RETRO_THEME.axisColor,
            borderWidth: 2,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          label: {
            show: showValues,
            position: stacked ? 'inside' : 'top',
            color: stacked ? 'white' : RETRO_THEME.textColor,
            fontWeight: 'bold',
            fontSize: 10,
            formatter: (params: any) => {
              return params.value >= 1000
                ? `$${(params.value / 1000).toFixed(1)}k`
                : `$${params.value}`;
            },
          },
        },
        {
          name: 'Net',
          type: 'bar',
          data: netData,
          itemStyle: {
            color: (params: any) => {
              // Positive net = purple, negative = orange
              return params.value >= 0 ? RETRO_THEME.colors[0] : RETRO_THEME.colors[7];
            },
            borderColor: RETRO_THEME.axisColor,
            borderWidth: 2,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          label: {
            show: showValues,
            position: (params: any) => (params.value >= 0 ? 'top' : 'bottom'),
            color: RETRO_THEME.textColor,
            fontWeight: 'bold',
            fontSize: 10,
            formatter: (params: any) => {
              const sign = params.value >= 0 ? '+' : '';
              return params.value >= 1000 || params.value <= -1000
                ? `${sign}$${(params.value / 1000).toFixed(1)}k`
                : `${sign}$${params.value}`;
            },
          },
        },
      ],
    };
  }, [data, showValues, stacked]);

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

export default MonthlyIncomeExpenseChart;
