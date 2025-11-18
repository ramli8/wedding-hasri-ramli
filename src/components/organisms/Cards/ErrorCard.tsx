import { SmOutlineButton } from "@/components/atoms/Buttons/SmOutlineBtn"
import { EmptySolidIconMade } from "@/components/atoms/IconsMade"
import PlainCard from "@/components/molecules/Card"
import { Flex, Text } from "@chakra-ui/react"
import { useTranslations } from "next-intl"
import { mutate } from "swr"

const ErrorCard = ({ title, mutateKey }: { title?: string, mutateKey: string }) => {
    const t = useTranslations("Common");
    
    return (
        <>
            <Flex w="100%" py="24px">
                <PlainCard
                    w="100%"
                    h="200px"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    flexDir="column"
                >
                    <EmptySolidIconMade fontSize="32px" mb="8px" />
                    <Text fontSize="20px" fontWeight="500">
                        {title ?? t("error_load")}
                    </Text>
                    <SmOutlineButton mt="auto" marginTop="8px" onClick={() => mutate(mutateKey)}>
                        {t("try_again")}
                    </SmOutlineButton>
                </PlainCard>
            </Flex>
        </>
    )
}

export default ErrorCard