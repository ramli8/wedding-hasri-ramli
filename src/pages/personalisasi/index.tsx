/**
 * @file personalisasi/index.tsx
 * @description This is the personalisasi page. User can change the language and the color theme of the website.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import PageTransition from "@/components/PageLayout";
import ContainerQuery from "@/components/atoms/ContainerQuery";
import PageRow from "@/components/atoms/PageRow";
import BahasaCard from "@/modules/personalisasi/components/PersonalisasiPage/BahasaCard";
import ModeTampilanCard from "@/modules/personalisasi/components/PersonalisasiPage/ModeTampilanCard";
import { useTranslations } from "next-intl";

const Personalisasi = () => {
    const t = useTranslations("Common.modules.personalisasi");

    return (
        <>
            <PageTransition pageTitle={t("title")}>
                <PageRow>
                    <ContainerQuery>
                        <ModeTampilanCard />
                        <BahasaCard />
                    </ContainerQuery>
                </PageRow>
            </PageTransition>
        </>
    );
};

export default Personalisasi;