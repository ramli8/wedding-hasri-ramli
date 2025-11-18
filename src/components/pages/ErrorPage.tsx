import { DaliSubtleButton } from '@/components/atoms/Buttons/DaliButton'
import { MyITSLogo } from '@/components/atoms/IconsMade'
import { NextPageWithLayout } from '@/pages/_app'
import AppSettingContext, {
  AppSettingProvider,
} from '@/providers/AppSettingProvider'
import LanguageProvider from '@/providers/LanguageProvider'
import theme from '@/theme/theme'
import {
  Box,
  Center,
  ChakraProvider,
  Flex,
  Text,
  useColorMode,
} from '@chakra-ui/react'
import Head from 'next/head'
import {
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useContext,
} from 'react'

type Props = {
  statusCode: number
  title: string
  action?: {
    icon: ReactNode
    text: string
    onClick: MouseEventHandler<HTMLButtonElement>
  }
}

export const ErrorPage: NextPageWithLayout<Props> = ({
  statusCode,
  title,
  action,
}) => {
  const { colorMode } = useColorMode()
  const { colorPref } = useContext(AppSettingContext)
  return (
    <>
      <Head>
        <title>{`${title} • ${process.env.NEXT_PUBLIC_APP_NAME_FULL}`}</title>
      </Head>
      <Box
        pos="relative"
        bgGradient={
          colorMode === 'light'
            ? `linear(to-tr, ${colorPref}.100, transparent, transparent, transparent, transparent, transparent, ${colorPref}.100)`
            : `linear(to-tr, ${colorPref}.800, transparent, transparent, transparent, transparent, transparent, ${colorPref}.800)`
        }
      >
        <Center gap={1.5} h="128px" pos="absolute" w="full">
          <MyITSLogo
            fontSize="56px"
            color={colorMode === 'light' ? '#013880' : 'white'}
            lineHeight="1"
          />
          <Text fontSize="21px" fontWeight={600} mb="5px">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </Text>
        </Center>
        <Flex justifyContent="center" alignItems="center" w="full" h="100vh">
          <Box>
            <Box>
              <Text
                fontSize="96px"
                fontWeight={800}
                textAlign="center"
                lineHeight="1.2"
                bgGradient={`linear(to-l, ${colorPref}.300, ${colorPref}.500)`}
                bgClip="text"
              >
                {statusCode}
              </Text>
              <Text fontSize="20px" textAlign="center" lineHeight="1.2">
                {title}
              </Text>
            </Box>
            {action && (
              <Center mt="48px">
                <DaliSubtleButton gap={3} onClick={action.onClick}>
                  {action.icon}
                  {action.text}
                </DaliSubtleButton>
              </Center>
            )}
          </Box>
        </Flex>
      </Box>
    </>
  )
}

ErrorPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <AppSettingProvider>
        <LanguageProvider>
          <ChakraProvider theme={theme}>{page}</ChakraProvider>
        </LanguageProvider>
      </AppSettingProvider>
    </>
  )
}

export default ErrorPage


