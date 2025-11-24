import { Box, Heading, VStack, Flex, Text, useColorMode, HStack } from "@chakra-ui/react";
import ContainerQuery from "@/components/atoms/ContainerQuery";
import withAuth from "@/hoc/withAuth";
import AdminLayout from "@/components/layouts/AdminLayout";
import AccountInfoContext from "@/providers/AccountInfoProvider";
import { useContext } from "react";
import { NextPageWithLayout } from "@/pages/_app";
import UserProfileActions from "@/components/molecules/UserProfileActions";

const DashboardPage: NextPageWithLayout = () => {
  const accountInfo = useContext(AccountInfoContext);
  const { colorMode } = useColorMode();
  
  // Find the role name based on the active role ID
  const activeRoleName = accountInfo?.role?.find(r => r.id === accountInfo?.activeRole)?.name || 'No Role';

  return (
    <ContainerQuery>
      <VStack spacing={6} align="stretch" py={8}>
        {/* Header Section */}
        <Flex
          justify="space-between"
          align={{ base: 'center', md: 'center' }}
          direction={{ base: 'row', md: 'row' }}
          gap={{ base: 2, md: 4 }}
          wrap={{ base: 'nowrap', md: 'nowrap' }}
        >
          <VStack align="start" spacing={1} flex={1} minW={0}>
            <Text
              fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
              fontWeight="700"
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              noOfLines={1}
            >
              Dashboard
            </Text>
            <HStack spacing={2}>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                noOfLines={1}
              >
                Hai selamat datang, role Anda adalah {activeRoleName}
              </Text>
            </HStack>
          </VStack>
          
          {/* User Profile & Actions */}
          <Box flexShrink={0}>
            <UserProfileActions />
          </Box>
        </Flex>
      </VStack>
    </ContainerQuery>
  );
};

const ProtectedDashboardPage = withAuth(DashboardPage);

(ProtectedDashboardPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedDashboardPage;
