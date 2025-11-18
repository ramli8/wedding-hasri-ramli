import { Box, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

interface DetailInfoInterface {
    title: string;
    desc: string | ReactNode;
}

const DetailInfo = ({ title, desc }: DetailInfoInterface) => {
    return (
        <>
            <Box className="grid grid-cols-12 gap-x-4">
                <Box className="col-span-4 sm:col-span-2">
                    <Text color="itsgray.700" fontSize="14px">
                        {title}
                    </Text>
                </Box>
                <Box className="col-span-8 sm:col-span-10">
                    <Text fontSize="14px" fontWeight="500">
                        {desc}
                    </Text>
                </Box>
            </Box>
        </>
    );
};

export default DetailInfo;
