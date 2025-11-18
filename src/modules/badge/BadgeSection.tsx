import PageTransition from "@/components/PageLayout"
import { NeutralBadge, NeutralTextBadge, NeutralOutlineBadge, NeutralSubtleBadge } from "@/components/atoms/BadgeStatus/NeutralBadge"
import { DangerBadge, DangerTextBadge, DangerOutlineBadge, DangerSubtleBadge } from "@/components/atoms/BadgeStatus/DangerBadge"
import { PrimaryBadge, PrimaryTextBadge, PrimaryOutlineBadge, PrimarySubtleBadge } from "@/components/atoms/BadgeStatus/PrimaryBadge"
import { SuccessBadge, SuccessTextBadge, SuccessOutlineBadge, SuccessSubtleBadge } from "@/components/atoms/BadgeStatus/SuccessBadge"
import { WarningBadge, WarningTextBadge, WarningOutlineBadge, WarningSubtleBadge } from "@/components/atoms/BadgeStatus/WarningBadge"
import ContainerQuery from "@/components/atoms/ContainerQuery"
import { AddSolidIconMade } from "@/components/atoms/IconsMade"
import PageRow from "@/components/atoms/PageRow"
import PlainCard from "@/components/organisms/Cards/Card"
import CodeSnippet from "@/components/molecules/CodeSnippet"
import { Box, Divider, Flex, Grid, Heading, HStack, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react"
import { useTranslations } from "next-intl"

const BadgeSection = () => {
    const t = useTranslations('Badge')

    const badgeTypes = [
        {
            type: "Primary",
            components: [
                { component: PrimaryBadge, name: "PrimaryBadge", variant: "Default" },
                { component: PrimarySubtleBadge, name: "PrimarySubtleBadge", variant: "Subtle" },
                { component: PrimaryOutlineBadge, name: "PrimaryOutlineBadge", variant: "Outline" },
                { component: PrimaryTextBadge, name: "PrimaryTextBadge", variant: "Text" },
            ]
        },
        {
            type: "Success",
            components: [
                { component: SuccessBadge, name: "SuccessBadge", variant: "Default" },
                { component: SuccessSubtleBadge, name: "SuccessSubtleBadge", variant: "Subtle" },
                { component: SuccessOutlineBadge, name: "SuccessOutlineBadge", variant: "Outline" },
                { component: SuccessTextBadge, name: "SuccessTextBadge", variant: "Text" },
            ]
        },
        {
            type: "Warning",
            components: [
                { component: WarningBadge, name: "WarningBadge", variant: "Default" },
                { component: WarningSubtleBadge, name: "WarningSubtleBadge", variant: "Subtle" },
                { component: WarningOutlineBadge, name: "WarningOutlineBadge", variant: "Outline" },
                { component: WarningTextBadge, name: "WarningTextBadge", variant: "Text" },
            ]
        },
        {
            type: "Danger",
            components: [
                { component: DangerBadge, name: "DangerBadge", variant: "Default" },
                { component: DangerSubtleBadge, name: "DangerSubtleBadge", variant: "Subtle" },
                { component: DangerOutlineBadge, name: "DangerOutlineBadge", variant: "Outline" },
                { component: DangerTextBadge, name: "DangerTextBadge", variant: "Text" },
            ]
        },
        {
            type: "Neutral",
            components: [
                { component: NeutralBadge, name: "NeutralBadge", variant: "Default" },
                { component: NeutralSubtleBadge, name: "NeutralSubtleBadge", variant: "Subtle" },
                { component: NeutralOutlineBadge, name: "NeutralOutlineBadge", variant: "Outline" },
                { component: NeutralTextBadge, name: "NeutralTextBadge", variant: "Text" },
            ]
        }
    ]

    const getBadgeCode = (name: string, hasIcon: boolean = false) => {
        const icon = hasIcon ? "<AddSolidIconMade fontSize=\"16px\" mr=\"8px\" />" : ""
        return `import { ${name} } from "@/components/atoms/BadgeStatus/${name.replace(/Badge$|TextBadge$|OutlineBadge$|SubtleBadge$/, "Badge")}"\n\n<${name}>${icon}Badge Text</${name}>`
    }

    return (
        <>
            <PageTransition pageTitle={t("ModuleName")}>
                <PageRow>
                    <ContainerQuery>
                        <PlainCard mt="32px">
                            <Box mb={12}>
                                <Heading as="h2" fontWeight="bold" size="md" mb={4}>Badge Variants</Heading>
                                <Text mb={4}>
                                    Our badge components come in several variants for different visual styles:
                                </Text>
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Default</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Solid background with high visibility, good for important status indicators.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Subtle</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Lower contrast variant with matching background and text colors.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Outline</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Border with transparent background for medium emphasis.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Text</Text>
                                        <Text fontSize="sm" mb={4}>
                                            Text-only badge with no background or border for minimal emphasis.
                                        </Text>
                                    </Box>
                                </Grid>
                            </Box>

                            <Tabs variant="enclosed">
                                <TabList>
                                    {badgeTypes.map((type) => (
                                        <Tab key={type.type}>{type.type}</Tab>
                                    ))}
                                </TabList>
                                <TabPanels>
                                    {badgeTypes.map((type) => (
                                        <TabPanel key={type.type}>
                                            <Stack spacing={8}>
                                                {type.components.map((item) => {
                                                    const BadgeComponent = item.component
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
                                                                    <Text fontWeight="bold" mb={1}>{item.variant} Badge</Text>
                                                                    <Text fontSize="sm" color="gray.500">{`<${item.name}>`}</Text>
                                                                </Box>
                                                                <Flex gap={4} align="center">
                                                                    <BadgeComponent>Badge Text</BadgeComponent>
                                                                    <BadgeComponent><AddSolidIconMade fontSize="16px" mr="8px" />With Icon</BadgeComponent>
                                                                </Flex>
                                                            </Flex>
                                                            <CodeSnippet
                                                                code={getBadgeCode(item.name)}
                                                                language="tsx"
                                                                title="Basic Usage"
                                                            />
                                                            <CodeSnippet
                                                                code={getBadgeCode(item.name, true)}
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
                                <Heading as="h2" fontWeight="bold" size="md" mb={4}>Badge Props</Heading>
                                <Text mb={4}>
                                    All badge components accept standard Box props from Chakra UI.
                                </Text>
                                <CodeSnippet
                                    code={`// Common props you can use with all badge components
<PrimaryBadge
  fontSize="14px"
  fontWeight="600"
  p="6px 12px"
  borderRadius="full"
  onClick={() => alert('Badge clicked!')}
>
  Badge Text
</PrimaryBadge>`}
                                    language="tsx"
                                    title="Badge Props Example"
                                />
                            </Box>
                        </PlainCard>
                    </ContainerQuery>
                </PageRow>
            </PageTransition>
        </>
    )
}

export default BadgeSection