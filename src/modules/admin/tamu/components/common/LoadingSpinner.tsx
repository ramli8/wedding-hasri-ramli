import React from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Memuat data...' }) => {
  return (
    <Flex justify="center" align="center" py={10} direction="column" gap={4}>
      <Spinner size="xl" />
      <Text>{message}</Text>
    </Flex>
  );
};

export default LoadingSpinner;