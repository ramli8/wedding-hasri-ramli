import AppSettingContext from '@/providers/AppSettingProvider';
import { Box, Flex } from '@chakra-ui/react';
import { NextComponentType, NextPageContext } from 'next';
import {
  Component,
  ReactNode,
  createContext,
  useState,
  useContext,
} from 'react';
import useDimensions from 'react-cool-dimensions';

const PageCol = ({ children }: { children: ReactNode }) => {
  const { setCardWidth } = useContext(AppSettingContext);
  const { observe } = useDimensions({
    breakpoints: { XS: 0, SM: 320, MD: 480, LG: 640, XL: 1080 },
    updateOnBreakpointChange: true,
    onResize: ({ currentBreakpoint }) => {
      if (currentBreakpoint == 'XL') {
        setCardWidth('33%');
      } else if (currentBreakpoint == 'LG') {
        setCardWidth('50%');
      } else if (
        currentBreakpoint == 'MD' ||
        currentBreakpoint == 'SM' ||
        currentBreakpoint == 'XS'
      ) {
        setCardWidth('100%');
      }
    },
  });

  return (
    <>
      <Box
        ref={observe}
        className="page__col"
        sx={{
          ':only-of-type': {
            flex: '0 0 calc(100%)',
            maxWidth: 'calc(100%)',
            borderRight: 'none',
            // paddingRight: { base: "0", w: "64px" },
          },
        }}
        // p={{ base: "0", x: "0px 24px 44px 64px" }}
        pt="0"
        width="100%"
        maxW="100%"
        p={{
          base: '0 16px',
          x: '0 24px 44px 0',
        }}
      >
        {children}
      </Box>
    </>
  );
};

export default PageCol;
