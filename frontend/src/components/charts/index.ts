/**
 * Chart Components Index
 *
 * Centralized exports for Apache ECharts-based chart components
 */

// Type definitions
export * from './types';

// Base chart wrapper
export { default as BaseChart } from './BaseChart';

// Chart components
export { default as BalanceOverTimeChart } from './BalanceOverTimeChart';
export { default as MonthlyIncomeExpenseChart } from './MonthlyIncomeExpenseChart';
export { default as CategoryBreakdownChart } from './CategoryBreakdownChart';
export { default as ScenarioProjectionChart } from './ScenarioProjectionChart';

// Interactive components
export { default as ChartDetailDrawer } from './ChartDetailDrawer';
