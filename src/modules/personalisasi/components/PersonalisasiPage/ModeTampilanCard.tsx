/**
 * @file ModeTampilanCard.tsx
 * @description This is the mode tampilan card. User can change the color theme of the website.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { CircleSolidIconMade } from "@/components/atoms/IconsMade";
import { RadioCard, RadioCardGroup } from "@/components/molecules/RadioCard";
import PlainCard from "@/components/organisms/Cards/Card";
import AppSettingContext from "@/providers/AppSettingProvider";
import { ColorPreference } from "@/types/app-setting";
import {
    Box,
    BoxProps,
    Divider,
    Flex,
    Grid,
    GridItem,
    HStack,
    Text,
    useColorMode,
    useRadio,
    useRadioGroup,
    UseRadioProps
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import { showSuccessAlert } from "@/utils/sweetalert";

const ModeTampilanCard = () => {
    const t = useTranslations("Personalisasi.tampilan");
    const { setColorMode, colorMode } = useColorMode();

    const { colorPref, setColorPref } = useContext(AppSettingContext);
    const { getRootProps, getRadioProps } = useRadioGroup({
        value: colorPref,
        onChange: (newColor) => {
            if (setColorPref && newColor) {
                const validColor = newColor as ColorPreference;
                setColorPref(validColor);
                localStorage.setItem("color_pref", validColor);
                showSuccessAlert("Warna tema berhasil diubah", colorMode);
            }
        },
    });
    const group = getRootProps();
    const optionsColor: ColorPreference[] = [
        "blue",
        "purple",
        "pink",
        "orange",
        "green",
        "teal",
        "cyan",
    ];

    const handleChange = (newColorMode: "light" | "dark") => {
        setColorMode(newColorMode);
        showSuccessAlert(
            newColorMode === "light" ? "Mode terang diaktifkan" : "Mode gelap diaktifkan",
            newColorMode
        );
    };

    return (
        <PlainCard>
            <Text 
                fontSize={{ base: 'lg', md: 'xl' }} 
                fontWeight="700" 
                mb={2}
                color={colorMode === 'light' ? 'gray.800' : 'white'}
            >
                {t("title")}
            </Text>
            <Text 
                fontSize={{ base: 'sm', md: 'md' }} 
                fontWeight="400" 
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                mb={6}
            >
                {t("subtitle")}
            </Text>
            <Grid
                templateColumns={{
                    base: "repeat(1, 1fr)",
                    a: "repeat(2, 1fr)",
                }}
                gap={4}
                as={RadioCardGroup}
                value={colorMode}
                transition="all .25s"
                // @ts-expect-error
                onChange={handleChange}
            >
                <RadioCard hasMark h="100%" as={GridItem} value="light" hasBackground>
                    <Text fontSize="sm" fontWeight={600}>
                        {t("option.light")}
                    </Text>
                </RadioCard>
                <RadioCard hasMark h="100%" as={GridItem} value="dark" hasBackground>
                    <Text fontSize="sm" fontWeight={600}>
                        {t("option.dark")}
                    </Text>
                </RadioCard>
            </Grid>
            <Divider w="full" my={6} />
            <HStack flexWrap="wrap" gap={4} {...group}>
                {optionsColor.map((value) => {
                    const radio = getRadioProps({ value });
                    return (
                        <RadioBox
                            key={value}
                            {...radio}
                            borderRadius="full"
                            bg={colorMode === "light" ? `${value}.500` : `${value}Dim.500`}
                            color="transparent"
                            position="relative"
                            w="36px"
                            h="36px"
                            _checked={{
                                boxShadow: "0px 0px 0 2px #00000034 inset",
                                color: "white",
                            }}
                        >
                            <Flex
                                justifyContent="center"
                                alignItems="center"
                                w="full"
                                h="full"
                                position="absolute"
                            >
                                <CircleSolidIconMade fontSize="12px" />
                            </Flex>
                        </RadioBox>
                    );
                })}
            </HStack>
        </PlainCard>
    );
};

export default ModeTampilanCard;

interface RadioCardProps extends Omit<BoxProps, "onChange">, UseRadioProps {
    children: React.ReactNode;
}

const RadioBox: React.FC<RadioCardProps> = (props) => {
    const { getInputProps, getRadioProps } = useRadio(props);

    const input = getInputProps();
    const checkbox = getRadioProps();

    const { isChecked, ...rest } = props;

    return (
        <Box as="label" _notFirst={{ marginInlineStart: "unset" }} {...rest}>
            <input {...input} />
            <Box {...checkbox} cursor="pointer" transition="all .25s" {...rest}>
                {props.children}
            </Box>
        </Box>
    );
};