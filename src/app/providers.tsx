'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/theme/theme';
import langId from '@/lang/id';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="id" messages={langId}>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </NextIntlClientProvider>
  );
}
