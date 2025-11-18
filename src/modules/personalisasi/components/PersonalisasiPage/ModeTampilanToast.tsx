/**
 * @file ModeTampilanToast.tsx
 * @description This is the mode tampilan toast. It is used to display a toast when the mode tampilan is changed.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import {
    CheckmarkOutlineIconMade
} from "@/components/atoms/IconsMade";
import ToastCard from "@/components/molecules/ToastCard";
import {
    useColorMode
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";

const ToastModeTampilan = ({ onClose }: { onClose: () => void }) => {
    const t = useTranslations("Personalisasi.tampilan");
    const { colorMode } = useColorMode();

    return (
        <ToastCard
            title={t("berhasil_mengubah_mode_tampilan")}
            description={t("mode_tampilan_telah_diubah_menjadi_x", {
                x: t(`option.${colorMode}`).toLowerCase(),
            })}
            onClose={onClose}
            status="success"
            icon={<CheckmarkOutlineIconMade fontSize="24px" color="white" />}
        />
    );
};

export default ToastModeTampilan;