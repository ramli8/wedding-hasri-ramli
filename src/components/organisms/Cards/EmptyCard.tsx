import { EmptySolidIconMade } from "@/components/atoms/IconsMade"
import PlainCard from "@/components/molecules/Card"
import { Flex, Text } from "@chakra-ui/react"

const EmptyCard = ({ title }: { title: string }) => {
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
                    <EmptySolidIconMade fontSize="32px" mb="8px"/>
                    <Text fontSize="16px" fontWeight="500">
                        {title}
                    </Text>
                </PlainCard>
            </Flex>
        </>
    )
}

export default EmptyCard