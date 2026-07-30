import React from 'react';
import { Button } from './Button';

interface RetryButtonProps {
  onRetry: () => void;
  title?: string;
  isLoading?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  title = 'Retry',
  isLoading = false,
}) => {
  return <Button title={title} onPress={onRetry} variant="outline" size="sm" isLoading={isLoading} />;
};
