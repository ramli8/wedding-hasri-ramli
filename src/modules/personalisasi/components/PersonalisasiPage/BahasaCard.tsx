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
    useToast
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useContext } from "react";
import BahasaToast from "./BahasaToast";

const BahasaCard = () => {
    const { langPref, setLangPref } = useContext(AppSettingContext);
    const t = useTranslations("Personalisasi.bahasa");
    const toast = useToast();

    const handleChangeLanguage = (newLangPref: LanguagePreference) => {
        setLangPref(newLangPref);
        localStorage.setItem("lang_pref", newLangPref);
        toast({
            position: "top-right",
            status: "success",
            duration: 5000,
            isClosable: true,
            render: (props) => <BahasaToast onClose={props.onClose} />,
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
                    // d: "repeat(3, 1fr)",
                }}
                gap={3}
                as={RadioCardGroup}
                value={langPref}
                // @ts-expect-error
                onChange={handleChangeLanguage}
                transition="all .25s"
            >
                <RadioCard hasMark h="100%" as={GridItem} value="id" hasBackground>
                    <Text fontSize="14px" fontWeight={600}>
                        {t("language.id")}
                    </Text>
                </RadioCard>
                <RadioCard hasMark h="100%" as={GridItem} value="en" hasBackground>
                    <Text fontSize="14px" fontWeight={600}>
                        {t("language.en")}
                    </Text>
                </RadioCard>
            </Grid>
        </PlainCard>
    );
};

export default BahasaCard;