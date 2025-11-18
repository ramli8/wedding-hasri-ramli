import PageTransition from "@/components/PageLayout"
import { DaliButton, DaliGhostButton, DaliOutlineButton, DaliSubtleButton } from "@/components/atoms/Buttons/DaliButton"
import { DangerButton, DangerGhostButton, DangerOutlineButton, DangerSubtleButton } from "@/components/atoms/Buttons/DangerButton"
import { PrimaryButton, PrimaryGhostButton, PrimaryOutlineButton, PrimarySubtleButton } from "@/components/atoms/Buttons/PrimaryButton"
import { SuccessButton, SuccessGhostButton, SuccessOutlineButton, SuccessSubtleButton } from "@/components/atoms/Buttons/SuccessButton"
import { WarningButton, WarningGhostButton, WarningOutlineButton, WarningSubtleButton } from "@/components/atoms/Buttons/WarningButton"
import ContainerQuery from "@/components/atoms/ContainerQuery"
import { AddSolidIconMade } from "@/components/atoms/IconsMade"
import PageRow from "@/components/atoms/PageRow"
import PlainCard from "@/components/organisms/Cards/Card"
import CodeSnippet from "@/components/molecules/CodeSnippet"
import { Box, Divider, Flex, Grid, Heading, HStack, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react"
import { useTranslations } from "next-intl"

const ButtonSection = () => {
    const t = useTranslations('Button')

    const buttonTypes = [
        {
            type: "Primary",
            components: [
                { component: PrimaryButton, name: "PrimaryButton", variant: "Default" },
                { component: PrimarySubtleButton, name: "PrimarySubtleButton", variant: "Subtle" },
                { component: PrimaryOutlineButton, name: "PrimaryOutlineButton", variant: "Outline" },
                { component: PrimaryGhostButton, name: "PrimaryGhostButton", variant: "Ghost" },
            ]
        },
        {
            type: "Success",
            components: [
                { component: SuccessButton, name: "SuccessButton", variant: "Default" },
                { component: SuccessSubtleButton, name: "SuccessSubtleButton", variant: "Subtle" },
                { component: SuccessOutlineButton, name: "SuccessOutlineButton", variant: "Outline" },
                { component: SuccessGhostButton, name: "SuccessGhostButton", variant: "Ghost" },
            ]
        },
        {
            type: "Warning",
            components: [
                { component: WarningButton, name: "WarningButton", variant: "Default" },
                { component: WarningSubtleButton, name: "WarningSubtleButton", variant: "Subtle" },
                { component: WarningOutlineButton, name: "WarningOutlineButton", variant: "Outline" },
                { component: WarningGhostButton, name: "WarningGhostButton", variant: "Ghost" },
            ]
        },
        {
            type: "Danger",
            components: [
                { component: DangerButton, name: "DangerButton", variant: "Default" },
                { component: DangerSubtleButton, name: "DangerSubtleButton", variant: "Subtle" },
                { component: DangerOutlineButton, name: "DangerOutlineButton", variant: "Outline" },
                { component: DangerGhostButton, name: "DangerGhostButton", variant: "Ghost" },
            ]
        },
        {
            type: "Dali",
            components: [
                { component: DaliButton, name: "DaliButton", variant: "Default" },
                { component: DaliSubtleButton, name: "DaliSubtleButton", variant: "Subtle" },
                { component: DaliOutlineButton, name: "DaliOutlineButton", variant: "Outline" },
                { component: DaliGhostButton, name: "DaliGhostButton", variant: "Ghost" },
            ]
        }
    ]

    const getButtonCode = (name: string, hasIcon: boolean = false) => {
        const icon = hasIcon ? "<AddSolidIconMade fontSize=\"16px\" mr=\"8px\" />" : ""
        return `import { ${name} } from "@/components/atoms/Buttons/${name.replace(/Button$|SubtleButton$|OutlineButton$|GhostButton$/, "Button")}"\n\n<${name}>${icon}Button Text</${name}>`
    }

    return (
        <>
            <PageTransition pageTitle={t("ModuleName")}>
                <PageRow>
                    <ContainerQuery>
                        <PlainCard mt="32px">
                            <Box mb={12}>
                                <Heading as="h2" fontWeight="bold" size="md" mb={4}>Button Variants</Heading>
                                <Text mb={4}>
                                    Our button components come in several variants for different contexts:
                                </Text>
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Default</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Use for primary actions and main CTAs.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Subtle</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Less emphasis, good for secondary actions.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Outline</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Border without fill, useful for less emphasis while maintaining visibility.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Ghost (Text)</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Minimal emphasis, appears as colored text with no background or border.
                                        </Text>
                                    </Box>
                                </Grid>
                            </Box>

                            <Tabs variant="enclosed">
                                <TabList>
                                    {buttonTypes.map((type) => (
                                        <Tab key={type.type}>{type.type}</Tab>
                                    ))}
                                </TabList>
                                <TabPanels>
                                    {buttonTypes.map((type) => (
                                        <TabPanel key={type.type}>
                                            <Stack spacing={8}>
                                                {type.components.map((item) => {
                                                    const ButtonComponent = item.component
                                                    return (
                                                        <Box key={item.name}>
                                                            <Flex 
                                                                direction={{ base: "column", md: "row" }}
                                                                gap={6}
                                                                align={{ base: "flex-start", md: "center" }}
                                                                justify="space-between"
                                                                mb={4}
                                                            >
                                                                <Box>
                                                                    <Text fontWeight="bold" mb={1}>{item.variant} Button</Text>
                                                                    <Text fontSize="sm" color="gray.500">{`<${item.name}>`}</Text>
                                                                </Box>
                                                                <Flex gap={4} align="center">
                                                                    <ButtonComponent>Button Text</ButtonComponent>
                                                                    <ButtonComponent><AddSolidIconMade fontSize="16px" mr="8px" />With Icon</ButtonComponent>
                                                                </Flex>
                                                            </Flex>
                                                            <CodeSnippet
                                                                code={getButtonCode(item.name)}
                                                                language="tsx"
                                                                title="Basic Usage"
                                                            />
                                                            <CodeSnippet
                                                                code={getButtonCode(item.name, true)}
                                                                language="tsx"
                                                                title="With Icon"
                                                            />
                                                            <Divider my={6} />
                                                        </Box>
                                                    )
                                                })}
                                            </Stack>
                                        </TabPanel>
                                    ))}
                                </TabPanels>
                            </Tabs>

                            <Box mt={12}>
                                <Heading as="h2" size="md" mb={4}>Button Props</Heading>
                                <Text mb={4}>
                                    All button components accept standard Button props from Chakra UI.
                                </Text>
                                <CodeSnippet
                                    code={`// Common props you can use with all button components
<PrimaryButton
  size="md"        // sizes: xs, sm, md, lg
  isDisabled={false}
  isLoading={false}
  onClick={() => alert('Button clicked!')}
  w="200px"        // width
  h="56px"         // height
>
  Button Text
</PrimaryButton>`}
                                    language="tsx"
                                    title="Button Props Example"
                                />
                            </Box>
                        </PlainCard>
                    </ContainerQuery>
                </PageRow>
            </PageTransition>
        </>
    )
}

export default ButtonSection