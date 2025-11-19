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
    UseRadioProps,
    useToast
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import ModeTampilanToast from "./ModeTampilanToast";

const ModeTampilanCard = () => {
    const t = useTranslations("Personalisasi.tampilan");
    const { setColorMode, colorMode } = useColorMode();
    const toast = useToast();

    const { colorPref, setColorPref } = useContext(AppSettingContext);
    const { getRootProps, getRadioProps } = useRadioGroup({
        value: colorPref,
        onChange: (newColor) => {
            if (setColorPref && newColor) {
                const validColor = newColor as ColorPreference;
                setColorPref(validColor);
                localStorage.setItem("color_pref", validColor);
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
        toast({
            position: "top-right",
            status: "success",
            duration: 5000,
            isClosable: true,
            render: (props) => <ModeTampilanToast onClose={props.onClose} />,
        });
    };

    return (
        <PlainCard>
            <Text fontSize="18px" fontWeight="600" mb="4px">
                {t("title")}
            </Text>
            <Text fontSize="16px" fontWeight="500" color="gray">
                {t("subtitle")}
            </Text>
            <Grid
                mt="24px"
                templateColumns={{
                    base: "repeat(1, 1fr)",
                    a: "repeat(2, 1fr)",
                }}
                gap={3}
                as={RadioCardGroup}
                value={colorMode}
                transition="all .25s"
                // @ts-expect-error
                onChange={handleChange}
            >
                <RadioCard hasMark h="100%" as={GridItem} value="light" hasBackground>
                    <Text fontSize="14px" fontWeight={600}>
                        {t("option.light")}
                    </Text>
                </RadioCard>
                <RadioCard hasMark h="100%" as={GridItem} value="dark" hasBackground>
                    <Text fontSize="14px" fontWeight={600}>
                        {t("option.dark")}
                    </Text>
                </RadioCard>
            </Grid>
            <Divider w="full" my="24px" />
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