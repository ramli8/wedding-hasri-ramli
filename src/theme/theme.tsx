import { ThemeConfig, extendTheme } from '@chakra-ui/react';
import { Poppins } from 'next/font/google';
import ButtonStyles from './Button';
import { cardTheme } from './Card';
import Color from './Color';
import Heading from './Heading';
import Link from './Link';
import { menuTheme } from './Menu';
import { modalTheme } from './Modal';
import Skeleton from './Skeleton';
import Text from './Text';
import { tooltipTheme } from './Tooltip';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

const breakpoints = {
  s: '474px',
  a: '639px',
  m: '767px',
  t: '1023px',
  d: '1179px',
  x: '1339px',
  w: '1419px',
};

const semanticTokens = {
  colors: {
    purple: 'purple.500',
    orange: 'orange.500',
    red: 'red.500',
    gray: 'gray.500',
    teal: 'teal.500',
    yellow: 'yellow.500',
    pink: 'pink.500',
    blue: 'blue.500',
    green: 'green.500',
    cyan: 'cyan.500',
  },
};

const theme = extendTheme({
  breakpoints,
  semanticTokens,
  config,
  fonts: {
    heading: poppins.style.fontFamily,
    body: poppins.style.fontFamily,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'light' ? 'white' : '#141414',
      },
    }),
  },
  components: {
    Card: cardTheme,
    Link,
    Text,
    Heading,
    ButtonStyles,
    Skeleton,
    Modal: modalTheme,
    Menu: menuTheme,
    Tooltip: tooltipTheme,
  },
  colors: Color,
});

export default theme;
