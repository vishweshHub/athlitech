import { useState, useCallback, useEffect } from 'react';
import { performanceService } from '../services/performance/performanceService';
import { PerformanceLog, PerformanceLogCreateRequest, MetricDefinition } from '../types';

export const usePerformanceLog = () => {
  const [metricDefinitions, setMetricDefinitions] = useState<MetricDefinition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetricDefinitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const defs = await performanceService.getMetricDefinitions();
      setMetricDefinitions(defs);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to fetch metric definitions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLog = async (payload: PerformanceLogCreateRequest): Promise<PerformanceLog | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const log = await performanceService.createPerformanceLog(payload);
      return log;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create performance log';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricDefinitions();
  }, [fetchMetricDefinitions]);

  return {
    metricDefinitions,
    isLoading,
    error,
    createLog,
    fetchMetricDefinitions,
  };
};
