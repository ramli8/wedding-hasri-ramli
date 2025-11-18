import { Box } from "@chakra-ui/react"
import { ReactNode } from "react";

const CustomRow = ({ children }: { children: ReactNode }) => {
    return (
        <>
            <Box className="grid grid-cols-12" pos="relative" gap="20px">
                {children}
            </Box>
        </>
    )
}

export default CustomRow