import PageTransition from "@/components/PageLayout"
import { PrimaryButton, PrimarySubtleButton } from "@/components/atoms/Buttons/PrimaryButton"
import ContainerQuery from "@/components/atoms/ContainerQuery"
import { ChevronDownOutlineIconMade, EditOutlineIconMade, InfoCircleOutlineIconMade, SettingOutlineIconMade, TrashOutlineIconMade } from "@/components/atoms/IconsMade"
import PageRow from "@/components/atoms/PageRow"
import PlainCard from "@/components/organisms/Cards/Card"
import { Box, Flex, HStack, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Portal, Stack, Text } from "@chakra-ui/react"
import { useTranslations } from "next-intl"

const MenuSection = () => {
    const t = useTranslations('Menu')

    return (
        <>
            <PageTransition pageTitle={t("ModuleName")}>
                <PageRow>
                    <ContainerQuery>
                        <PlainCard mt="32px">
                            <HStack w="full" justifyContent="space-between" gap="24">
                                <Stack w="full">
                                    <Text variant="texttitle">Menu Options</Text>
                                    <Stack gap="8px">
                                        <Menu>
                                            {({ isOpen }) => (
                                                <>
                                                    <MenuButton cursor="pointer" mt="4px" maxW={"max-content"}>
                                                        <PrimaryButton gap={2} w="max-content">
                                                            <ChevronDownOutlineIconMade
                                                                fontSize="16px"
                                                                mt={!isOpen ? "2px" : "0px"}
                                                                transition="transform 0.3s ease"
                                                                transform={!isOpen ? "rotate(0deg)" : "rotate(-180deg)"}
                                                            />
                                                            <Text fontSize="14px" fontWeight={600}>
                                                                {"Menu"}
                                                            </Text>
                                                        </PrimaryButton>
                                                    </MenuButton>
                                                    <Portal>
                                                        <MenuList
                                                            p="24px"
                                                            defaultChecked={false}
                                                            bg={"#FFFFFF"}
                                                        >
                                                            <MenuItem
                                                                icon={<InfoCircleOutlineIconMade fontSize="18px" />}
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="center">
                                                                    <Text>{"Lihat Detail"}</Text>
                                                                </Flex>
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={<EditOutlineIconMade fontSize="18px" />}
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="center">
                                                                    <Text>{"Edit"}</Text>
                                                                </Flex>
                                                            </MenuItem>
                                                            <MenuDivider />
                                                            <MenuItem
                                                                icon={<TrashOutlineIconMade fontSize="18px" />}
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="center">
                                                                    <Text>{"Delete"}</Text>
                                                                </Flex>
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Portal>
                                                </>
                                            )}
                                        </Menu>
                                    </Stack>
                                </Stack>
                                <Stack w="full">
                                    <Text variant="texttitle">Menu Description</Text>
                                    <Stack gap="8px">
                                        <Menu>
                                            {({ isOpen }) => (
                                                <>
                                                    <MenuButton cursor="pointer" mt="4px" maxW={"max-content"}>
                                                        <PrimarySubtleButton gap={2} w="max-content">
                                                            <Text fontSize="14px" fontWeight={600}>
                                                                {"Selengkapnya"}
                                                            </Text>
                                                        </PrimarySubtleButton>
                                                    </MenuButton>
                                                    <Portal>
                                                        <MenuList
                                                            p="24px"
                                                            defaultChecked={false}
                                                            bg={"#FFFFFF"}
                                                        >
                                                            <MenuItem
                                                                icon={<InfoCircleOutlineIconMade fontSize="18px" />}
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="center">
                                                                    <Text>{"Lihat Detail"}</Text>
                                                                </Flex>
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={<EditOutlineIconMade fontSize="18px" />}
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="center">
                                                                    <Text>{"Edit"}</Text>
                                                                </Flex>
                                                            </MenuItem>
                                                            <MenuDivider />
                                                            <MenuItem
                                                                icon={<TrashOutlineIconMade fontSize="18px" />}
                                                            >
                                                                <Flex justifyContent="space-between" alignItems="center">
                                                                    <Text>{"Delete"}</Text>
                                                                </Flex>
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Portal>
                                                </>
                                            )}
                                        </Menu>
                                    </Stack>
                                </Stack>
                            </HStack>
                        </PlainCard>
                    </ContainerQuery>
                </PageRow>
            </PageTransition >
        </>
    )
}

export default MenuSection