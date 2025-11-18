import { Center, Text, VStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

const DataLoader = () => {
    const t = useTranslations("Common");

    return (<>
        <Center p="100px">
            <VStack>
                <Text
                    fontSize="24px"
                    fontWeight="600"
                    mb="16px"
                    color="grey"
                >
                    {t("loading_data")}
                </Text>
            </VStack>
        </Center>
    </>
    )
}

export { DataLoader };
