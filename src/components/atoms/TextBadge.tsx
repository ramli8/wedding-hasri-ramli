import { Text, useColorMode } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

const TextBadgeGray = ({ text }: { text: string }) => {
    const { colorMode } = useColorMode()
    const t = useTranslations("Common")

    return (
        <Text fontSize="0.875rem" fontWeight={500} mt="4px" color={colorMode == 'light' ? 'gray.500' : 'grayDim.500'}>
            {t(text)}
        </Text>
    )
}

const TextBadgeYellow = ({ text }: { text: string }) => {
    const { colorMode } = useColorMode()
    const t = useTranslations("Common")

    return (
        <Text fontSize="0.875rem" fontWeight={500} mt="4px" color={colorMode == 'light' ? 'yellow.500' : 'yellowDim.500'}>
            {t(text)}
        </Text>
    )
}

const TextBadgeOrange = ({ text }: { text: string }) => {
    const { colorMode } = useColorMode()
    const t = useTranslations("Common")

    return (
        <Text fontSize="0.875rem" fontWeight={500} mt="4px" color={colorMode == 'light' ? 'orange.500' : 'orangeDim.500'}>
            {t(text)}
        </Text>
    )
}

const TextBadgeBlue = ({ text }: { text: string }) => {
    const { colorMode } = useColorMode()
    const t = useTranslations("Common")

    return (
        <Text fontSize="0.875rem" fontWeight={500} mt="4px" color={colorMode == 'light' ? 'blue.500' : 'blueDim.500'}>
            {t(text)}
        </Text>
    )
}

const TextBadgeGreen = ({ text }: { text: string }) => {
    const { colorMode } = useColorMode()
    const t = useTranslations("Common")

    return (
        <Text fontSize="0.875rem" fontWeight={500} mt="4px" color={colorMode == 'light' ? 'green.500' : 'greenDim.500'}>
            {t(text)}
        </Text>
    )
}

const TextBadgeRed = ({ text }: { text: string }) => {
    const { colorMode } = useColorMode()
    const t = useTranslations("Common")

    return (
        <Text fontSize="0.875rem" fontWeight={500} mt="4px" color={colorMode == 'light' ? 'red.500' : 'redDim.500'}>
            {t(text)}
        </Text>
    )
}

export { TextBadgeGray, TextBadgeYellow, TextBadgeOrange, TextBadgeBlue, TextBadgeGreen, TextBadgeRed };
