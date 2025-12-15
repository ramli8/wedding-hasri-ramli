/**
 * @file BahasaCard.tsx
 * @description This is the bahasa card. User can change the language of the website.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { RadioCard, RadioCardGroup } from "@/components/molecules/RadioCard";
import PlainCard from "@/components/organisms/Cards/Card";
import AppSettingContext from "@/providers/AppSettingProvider";
import { LanguagePreference } from "@/types/app-setting";
import {
    Grid,
    GridItem,
    Text,
    useColorMode
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import { showSuccessAlert } from "@/utils/sweetalert";

const BahasaCard = () => {
    const { langPref, setLangPref } = useContext(AppSettingContext);
    const t = useTranslations("Personalisasi.bahasa");
    const { colorMode } = useColorMode();

    const handleChangeLanguage = (newLangPref: LanguagePreference) => {
        if (setLangPref) {
            setLangPref(newLangPref);
            localStorage.setItem("lang_pref", newLangPref);
            showSuccessAlert(
                newLangPref === "id" ? "Bahasa Indonesia dipilih" : "English selected",
                colorMode
            );
        }
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
                value={langPref}
                // @ts-expect-error
                onChange={handleChangeLanguage}
                transition="all .25s"
            >
                <RadioCard hasMark h="100%" as={GridItem} value="id" hasBackground>
                    <Text fontSize="sm" fontWeight={600}>
                        {t("language.id")}
                    </Text>
                </RadioCard>
                <RadioCard hasMark h="100%" as={GridItem} value="en" hasBackground>
                    <Text fontSize="sm" fontWeight={600}>
                        {t("language.en")}
                    </Text>
                </RadioCard>
            </Grid>
        </PlainCard>
    );
};

export default BahasaCard;