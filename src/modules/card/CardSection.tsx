import PageTransition from "@/components/PageLayout"
import ContainerQuery from "@/components/atoms/ContainerQuery"
import { LayersSolidIconMade, HomeSolidIconMade, UserSolidIconMade } from "@/components/atoms/IconsMade"
import PageRow from "@/components/atoms/PageRow"
import Wrapper from "@/components/atoms/Wrapper"
import { CardDynamicIconShadow } from "@/components/organisms/CardIconShadow"
import PlainCard from "@/components/organisms/Cards/Card"
import CodeSnippet from "@/components/molecules/CodeSnippet"
import {
    Box,
    Divider,
    Flex,
    Grid,
    Heading,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useColorMode,
    Badge,
    Button,
    HStack,
    Avatar
} from "@chakra-ui/react"
import { useTranslations } from "next-intl"

const CardSection = () => {
    const t = useTranslations('Card')
    const { colorMode } = useColorMode()

    const exampleBgColor = colorMode === "light" ? "gray.100" : "gray.700"

    const cardTypes = [
        {
            type: "Basic Cards",
            description: "Simple container cards that can hold any content with a clean design.",
            components: [
                {
                    name: "PlainCard",
                    render: (
                        <Box p={8} bg={exampleBgColor} borderRadius="md" mb={3} position="relative">
                            <PlainCard width="100%" p="24px">
                                <Heading size="md" mb={4}>Card Title</Heading>
                                <Text>This is a basic card with title and text content. It provides a clean container for any content you want to display.</Text>
                            </PlainCard>
                        </Box>
                    ),
                    code: `import PlainCard from "@/components/organisms/Cards/Card"

<PlainCard width="100%" p="24px">
  <Heading size="md" mb={4}>Card Title</Heading>
  <Text>This is a basic card with title and text content. It provides a clean container for any content you want to display.</Text>
</PlainCard>
                    `
                },
                {
                    name: "Styled PlainCard",
                    render: (
                        <Box p={8} bg={exampleBgColor} borderRadius="md" mb={3} position="relative">
                            <PlainCard 
                                width="100%" 
                                p="24px" 
                                borderLeft="4px solid" 
                                borderColor="blue.500"
                                overflow="hidden"
                            >
                                <Box position="absolute" top={0} right={0} bg="blue.500" py={1} px={4} borderBottomLeftRadius="md">
                                    <Badge colorScheme="white" variant="solid" fontSize="xs">FEATURED</Badge>
                                </Box>
                                <Box pt={4}>
                                    <Heading size="md" mb={4} color="blue.500">Enhanced Card Example</Heading>
                                    <Text mb={4}>This styled card demonstrates how to create more visually engaging cards with borders, badges, and interactive elements.</Text>
                                    <HStack spacing={4} mt={5}>
                                        <Avatar size="sm" name="John Doe" src="https://bit.ly/dan-abramov" />
                                        <Box>
                                            <Text fontWeight="bold" fontSize="sm">John Doe</Text>
                                            <Text fontSize="xs" opacity={0.8}>Published Yesterday</Text>
                                        </Box>
                                    </HStack>
                                    <Button size="sm" colorScheme="blue" mt={4}>Learn More</Button>
                                </Box>
                            </PlainCard>
                        </Box>
                    ),
                    code: `import PlainCard from "@/components/organisms/Cards/Card"
import { Box, Heading, Text, HStack, Avatar, Button, Badge } from "@chakra-ui/react"

<PlainCard 
  width="100%" 
  p="24px" 
  borderLeft="4px solid" 
  borderColor="blue.500"
  overflow="hidden"
>
  <Box position="absolute" top={0} right={0} bg="blue.500" py={1} px={4} borderBottomLeftRadius="md">
    <Badge colorScheme="white" variant="solid" fontSize="xs">FEATURED</Badge>
  </Box>
  <Box pt={4}>
    <Heading size="md" mb={4} color="blue.500">Enhanced Card Example</Heading>
    <Text mb={4}>This styled card demonstrates how to create more visually engaging cards with borders, badges, and interactive elements.</Text>
    <HStack spacing={4} mt={5}>
      <Avatar size="sm" name="John Doe" src="https://bit.ly/dan-abramov" />
      <Box>
        <Text fontWeight="bold" fontSize="sm">John Doe</Text>
        <Text fontSize="xs" opacity={0.8}>Published Yesterday</Text>
      </Box>
    </HStack>
    <Button size="sm" colorScheme="blue" mt={4}>Learn More</Button>
  </Box>
</PlainCard>
                    `
                }
            ]
        },
        {
            type: "Icon Cards",
            description: "Cards with icons for navigation or feature highlights.",
            components: [
                {
                    name: "CardDynamicIconShadow",
                    render: (
                        <Box p={8} bg={exampleBgColor} borderRadius="md" mb={3} position="relative">
                            <Flex justifyContent="center" width="100%">
                                <CardDynamicIconShadow
                                    title="Dashboard"
                                    subtitle="Access main dashboard features"
                                    link="/card"
                                    icon={<HomeSolidIconMade w="30px" h="30px" />}
                                />
                            </Flex>
                        </Box>
                    ),
                    code: `import { CardDynamicIconShadow } from "@/components/organisms/CardIconShadow"
import { HomeSolidIconMade } from "@/components/atoms/IconsMade"

<CardDynamicIconShadow
  title="Dashboard"
  subtitle="Access main dashboard features"
  link="/dashboard"
  icon={<HomeSolidIconMade w="30px" h="30px" />}
/>
                    `
                },
                {
                    name: "Multiple Icon Cards",
                    render: (
                        <Box p={8} bg={exampleBgColor} borderRadius="md" mb={3} position="relative">
                            <Wrapper mt="-8px">
                                <CardDynamicIconShadow
                                    title="Dashboard"
                                    subtitle="Access main dashboard"
                                    link="/card"
                                    icon={<HomeSolidIconMade w="30px" h="30px" />}
                                />
                                <CardDynamicIconShadow
                                    title="Profile"
                                    subtitle="Manage your account"
                                    link="/card"
                                    icon={<UserSolidIconMade w="30px" h="30px" />}
                                />
                                <CardDynamicIconShadow
                                    title="Content"
                                    subtitle="Manage your content"
                                    link="/card"
                                    icon={<LayersSolidIconMade w="30px" h="30px" />}
                                />
                            </Wrapper>
                        </Box>
                    ),
                    code: `import Wrapper from "@/components/atoms/Wrapper"
import { CardDynamicIconShadow } from "@/components/organisms/CardIconShadow"
import { HomeSolidIconMade, UserSolidIconMade, LayersSolidIconMade } from "@/components/atoms/IconsMade"

<Wrapper>
  <CardDynamicIconShadow
    title="Dashboard"
    subtitle="Access main dashboard"
    link="/dashboard"
    icon={<HomeSolidIconMade w="30px" h="30px" />}
  />
  <CardDynamicIconShadow
    title="Profile"
    subtitle="Manage your account"
    link="/profile"
    icon={<UserSolidIconMade w="30px" h="30px" />}
  />
  <CardDynamicIconShadow
    title="Content"
    subtitle="Manage your content"
    link="/content"
    icon={<LayersSolidIconMade w="30px" h="30px" />}
  />
</Wrapper>
                    `
                }
            ]
        }
    ]

    return (
        <>
            <PageTransition pageTitle={t("ModuleName")}>
                <PageRow>
                    <ContainerQuery>
                        <PlainCard mt="32px">
                            <Box mb={12}>
                                <Heading as="h2" fontWeight="bold" size="md" mb={4}>Card Components</Heading>
                                <Text mb={4}>
                                    Cards are versatile containers that group related content and actions.
                                    They can contain various elements such as text, images, buttons, and more.
                                </Text>
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>PlainCard</Text>
                                        <Text fontSize="sm" mb={4}>
                                            A basic card container with shadow and rounded corners.
                                            Perfect for any content that needs to be visually grouped.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>CardDynamicIconShadow</Text>
                                        <Text fontSize="sm" mb={4}>
                                            A card with an icon that works well for navigation and highlighting features.
                                            Includes hover effects.
                                        </Text>
                                    </Box>
                                </Grid>
                            </Box>

                            <Tabs variant="enclosed">
                                <TabList>
                                    {cardTypes.map((type) => (
                                        <Tab key={type.type}>{type.type}</Tab>
                                    ))}
                                </TabList>
                                <TabPanels>
                                    {cardTypes.map((type) => (
                                        <TabPanel key={type.type}>
                                            <Text mb={4}>{type.description}</Text>
                                            <Stack spacing={8}>
                                                {type.components.map((item, index) => (
                                                    <Box key={index}>
                                                        <Text fontWeight="bold" mb={4}>{item.name}</Text>
                                                        <Box mb={6}>{item.render}</Box>
                                                        <CodeSnippet
                                                            code={item.code}
                                                            language="tsx"
                                                            title="Usage Example"
                                                        />
                                                        <Divider my={6} />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </TabPanel>
                                    ))}
                                </TabPanels>
                            </Tabs>

                            <Box mt={12}>
                                <Heading as="h2" fontWeight="bold" size="md" mb={4}>Card Props</Heading>
                                <Text mb={4}>
                                    All card components extend Chakra UI's Box props and can be styled using any Box props.
                                </Text>
                                <CodeSnippet
                                    code={`// Common props for PlainCard
<PlainCard
    p="24px"                  // padding
    mb="24px"                 // margin bottom
    borderRadius="24px"       // border radius
    bg="white"                // background color
    boxShadow="md"            // shadow
    width="100%"              // width
    maxW="400px"              // maximum width
    onClick={() => {}}        // event handlers
>
    Card Content Goes Here
</PlainCard>

// Props for CardDynamicIconShadow
<CardDynamicIconShadow
    title="Card Title"        // required
    subtitle="Description"    // required
    link="/page-url"          // required, link destination
    icon={<YourIcon />}       // icon component
/>`}
                                    language="tsx"
                                    title="Card Props"
                                />
                            </Box>
                        </PlainCard>
                    </ContainerQuery>
                </PageRow>
            </PageTransition>
        </>
    )
}

export default CardSection