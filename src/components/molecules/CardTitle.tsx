import { Box, Text } from "@chakra-ui/react"
import { ReactNode } from "react"

type CardTitleType = {
    title: string,
    subtitle: string,
    children?: ReactNode
}

const CardTitle = ({ title, subtitle, children }: CardTitleType) => {
    return <>
        <Box
            display={{ base: "block", a: "flex" }}
            justifyContent="space-between"
            alignItems="center"
            gap={6}
            mb="24px"
        >
            <Box>
                <Text fontSize="20px" fontWeight="600">
                    {title}
                </Text>
                <Text fontSize="16px" fontWeight={500} color="gray" mt="4px">
                    {subtitle}
                </Text>
            </Box>
            {children}
        </Box>
    </>
}

export default CardTitle