/**
 * Chart Component API Design
 *
 * TypeScript interfaces for Apache ECharts-based chart components
 * with retro aesthetic preservation
 */

/**
 * Common base props for all chart components
 */
export interface BaseChartProps {
  /** Chart width in pixels or percentage string (default: '100%') */
  width?: number | string;
  /** Chart height in pixels (default: 300) */
  height?: number | string;
  /** Whether chart is currently loading data */
  loading?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Retro theme configuration
 * Applied via ECharts theme API and CSS variables
 */
export interface RetroThemeConfig {
  /** Primary colors - vibrant retro palette */
  colors: string[];
  /** Background gradient */
  backgroundColor: string;
  /** Grid line color */
  gridColor: string;
  /** Axis line color */
  axisColor: string;
  /** Text color */
  textColor: string;
  /** Font family */
  fontFamily: string;
}

/**
 * Default retro theme matching original SVG aesthetic
 */
export const RETRO_THEME: RetroThemeConfig = {
  colors: [
    '#9966ff', // purple
    '#ff66cc', // pink
    '#ffcc00', // yellow
    '#00ccff', // cyan
    '#00ff99', // mint
    '#ff3366', // hot pink
    '#cc00ff', // violet
    '#ff9933', // orange
  ],
  backgroundColor: 'linear-gradient(135deg, #ffffdd 0%, #ffeeee 50%, #eeffff 100%)',
  gridColor: 'rgba(153, 102, 255, 0.1)',
  axisColor: '#330066',
  textColor: '#330066',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

/**
 * Data point for time series charts
 */
export interface TimeSeriesDataPoint {
  /** X-axis value (date/time/category) */
  x: string;
  /** Y-axis value (numeric) */
  y: number;
}

/**
 * Series data for multi-line charts
 */
export interface ChartSeries {
  /** Series name (shown in legend) */
  name: string;
  /** Array of data points */
  data: TimeSeriesDataPoint[];
  /** Optional custom color (overrides theme) */
  color?: string;
}

/**
 * Props for BalanceOverTimeChart (Line Chart)
 */
export interface BalanceOverTimeChartProps extends BaseChartProps {
  /** Array of series to display */
  series: ChartSeries[];
  /** Y-axis label (default: 'Balance') */
  yAxisLabel?: string;
  /** X-axis label (default: 'Month') */
  xAxisLabel?: string;
  /** Enable data zoom slider (default: false) */
  enableZoom?: boolean;
}

/**
 * Monthly financial data for bar chart
 */
export interface MonthlyFinancialData {
  /** Month identifier (YYYY-MM) */
  month: string;
  /** Income amount */
  income: number;
  /** Expense amount */
  expense: number;
  /** Net amount (income - expense) */
  net: number;
}

/**
 * Props for MonthlyIncomeExpenseChart (Bar Chart)
 */
export interface MonthlyIncomeExpenseChartProps extends BaseChartProps {
  /** Array of monthly financial data */
  data: MonthlyFinancialData[];
  /** Show values on bars (default: false) */
  showValues?: boolean;
  /** Stack bars instead of grouping (default: false) */
  stacked?: boolean;
}

/**
 * Category data for pie chart
 */
export interface CategoryData {
  /** Category name */
  category: string;
  /** Amount/value */
  amount: number;
}

/**
 * Props for CategoryBreakdownChart (Pie/Donut Chart)
 */
export interface CategoryBreakdownChartProps extends BaseChartProps {
  /** Array of category data */
  data: CategoryData[];
  /** Show as donut chart (default: true) */
  donut?: boolean;
  /** Inner radius percentage for donut (default: 40) */
  innerRadiusPercent?: number;
  /** Show percentage labels (default: true) */
  showPercentage?: boolean;
}

/**
 * Props for ScenarioProjectionChart (Multi-line comparison)
 */
export interface ScenarioProjectionChartProps extends BaseChartProps {
  /** Array of projection series (baseline + scenarios) */
  series: ChartSeries[];
  /** Highlight specific series by name */
  highlightSeries?: string;
  /** Enable legend toggle (default: true) */
  enableLegendToggle?: boolean;
  /** Mark future projections with different style */
  projectionStartMonth?: string;
}

/**
 * Common ECharts options builder helper type
 */
export type EChartsOptionBuilder<TProps> = (props: TProps, theme: RetroThemeConfig) => any;
