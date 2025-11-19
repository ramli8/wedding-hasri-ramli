import React from 'react';
import { Alert, AlertIcon, AlertTitle, AlertDescription, Box } from '@chakra-ui/react';

interface ErrorDisplayProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title = 'Error', description, onRetry }) => {
  return (
    <Alert status="error" borderRadius="md" boxShadow="md">
      <AlertIcon />
      <Box>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Box>
    </Alert>
  );
};

export default ErrorDisplay;