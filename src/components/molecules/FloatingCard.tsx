import { Button, Card, Flex, Stack, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import PlainCard from "../organisms/Cards/Card";

interface FloatingCardInterface {
    text: string;
    children?: ReactNode;
}

const FloatingBox = ({ children }: { children: ReactNode }) => {
    return (
        <Stack
            w="full"
            px="20px"
            alignItems="center"
            position="fixed"
            left="50%"
            transform="translate(-50%, 0)"
            bottom="60px"
            spacing="16px"
        >
            {children}
        </Stack>
    );
};

const FloatingCardSuccess = ({ text, children }: FloatingCardInterface) => {
    return (
        <PlainCard
            w="full"
            h="auto"
            p="20px"
            borderLeft="8px solid"
            borderLeftColor="green.500"
            borderRadius="8px"
            borderColor="itssuccess"
        >
            <Flex justifyContent="space-between" alignItems="center">
                <Text
                    fontSize="16px"
                    fontWeight="medium"
                    color="chakra-body-text._dark"
                >
                    {text}
                </Text>
                {children}
            </Flex>
        </PlainCard>
    );
};

const FloatingCardPrimary = ({ text, children }: FloatingCardInterface) => {
    return (
        <Card
            w="full"
            h="auto"
            p="20px"
            borderLeft="8px solid"
            borderLeftColor="blue.500"
            borderRadius="8px"
            borderColor="itsprimary"
        >
            <Flex justifyContent="space-between" alignItems="center">
                <Text
                    fontSize="16px"
                    fontWeight="medium"
                    color="chakra-body-text._dark"
                >
                    {text}
                </Text>
                {children}
            </Flex>
        </Card>
    );
};

const FloatingCardSecondary = ({ text, children }: FloatingCardInterface) => {
    return (
        <Card
            w="full"
            h="auto"
            p="20px"
            borderLeft="8px solid"
            borderLeftColor="grey.500"
            borderRadius="8px"
            borderColor="itssecondary"
        >
            <Flex justifyContent="space-between" alignItems="center">
                <Text
                    fontSize="16px"
                    fontWeight="medium"
                    color="chakra-body-text._dark"
                >
                    {text}
                </Text>
                {children}
            </Flex>
        </Card>
    );
};

const FloatingCardDanger = ({ text, children }: FloatingCardInterface) => {
    return (
        <Card
            w="full"
            h="auto"
            p="20px"
            borderLeft="8px solid"
            borderLeftColor="red.500"
            borderRadius="8px"
            borderColor="itsdanger"
        >
            <Flex justifyContent="space-between" alignItems="center">
                <Text
                    fontSize="16px"
                    fontWeight="medium"
                    color="chakra-body-text._dark"
                >
                    {text}
                </Text>
                {children}
            </Flex>
        </Card>
    );
};

export {
    FloatingBox,
    FloatingCardSuccess,
    FloatingCardPrimary,
    FloatingCardSecondary,
    FloatingCardDanger,
};
