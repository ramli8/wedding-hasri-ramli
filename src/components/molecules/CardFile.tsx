import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { DocumentIconMade } from "../atoms/IconsMade";

interface CardFileInterface {
    title: string;
    desc?: string;
    url?: string;
    type?: "pdf" | "jpg" | "png";
}

const CardFile = ({ title, url, type = "pdf" }: CardFileInterface) => {
    const router = useRouter();

    const download = () => {
        url && router.push(url);
    };

    return (
        <>
            <Box
                className="col-span-12 md:col-span-6 lg:col-span-4"
                border="1px solid #ededf0"
                borderRadius="8px"
                padding="20px"
                cursor="pointer"
                onClick={download}
            >
                <HStack justifyContent="left" spacing={4}>
                    {/* <DocumentIconMade
                        width={12}
                        height={12}
                    /> */}
                    <Image
                        src={`/images/icon/format-${type}.svg`}
                        alt="pdf"
                        width={40}
                        height={40}
                    />
                    <Stack>
                        <Text
                            variant="cardtitle"
                            fontSize="16px"
                            data-group="card--shadow"
                        >
                            {title}
                        </Text>
                        {/* <Text
                            color="itsgray.700"
                            fontFamily="poppins"
                            fontSize="13px"
                            overflowWrap="anywhere"
                            noOfLines={1}
                            mt={"0 !important"}
                        >
                            {desc}
                        </Text> */}
                    </Stack>
                </HStack>
            </Box>
        </>
    );
};

export default CardFile;
