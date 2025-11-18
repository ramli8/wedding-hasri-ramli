/**
 * @file BahasaToast.tsx
 * @description This is the bahasa toast. It is used to display a toast when the bahasa is changed.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import {
    CheckmarkOutlineIconMade
} from "@/components/atoms/IconsMade";
import ToastCard from "@/components/molecules/ToastCard";
import AppSettingContext from "@/providers/AppSettingProvider";
import { useTranslations } from "next-intl";
import { useContext } from "react";

const BahasaToast = ({ onClose }: { onClose: () => void }) => {
    const t = useTranslations("Personalisasi.bahasa");
    const { langPref } = useContext(AppSettingContext);

    return (
        <ToastCard
            title={t("berhasil_mengubah_bahasa")}
            description={t("bahasa_telah_diubah_menjadi_x", {
                x: t(`language.${langPref}`),
            })}
            onClose={onClose}
            status="success"
            icon={<CheckmarkOutlineIconMade fontSize="24px" color="white" />}
        />
    );
};

export default BahasaToast;