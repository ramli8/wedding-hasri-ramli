import { Center, Text, VStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

const DataError = ({ children }: { children: ReactNode }) => {
    const t = useTranslations("Common");

    return (
        <>
            <Center p="100px">
                <VStack>
                    <Text
                        fontSize="24px"
                        fontWeight="600"
                        mb="16px"
                    >
                        {t("error_load")}
                    </Text>
                    {children}
                </VStack>
            </Center>
        </>
    )
}

export { DataError };
