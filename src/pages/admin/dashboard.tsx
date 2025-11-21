import { Box, Heading, Flex } from "@chakra-ui/react";
import Sidebar from "@/components/organisms/Sidebar";
import PageTransition from "@/components/PageLayout";
import PageRow from "@/components/atoms/PageRow";
import ContainerQuery from "@/components/atoms/ContainerQuery";
import withAuth from "@/hoc/withAuth";
import AccountInfoContext from "@/providers/AccountInfoProvider";
import AppSettingContext from "@/providers/AppSettingProvider";
import { useContext } from "react";

const DashboardPage = () => {
  const accountInfo = useContext(AccountInfoContext);
  const { isNavbarOpen } = useContext(AppSettingContext);
  
  // Find the role name based on the active role ID
  const activeRoleName = accountInfo?.role?.find(r => r.id === accountInfo?.activeRole)?.name || 'User';

  return (
    <Flex>
      <Sidebar />
      <Box 
        w="full" 
        flex="1" 
        p={8}
        ml={{ base: 0, m: isNavbarOpen ? "300px" : "108px", d: "280px" }}
        transition="margin-left .25s"
      >
        <PageTransition pageTitle="Dashboard">
          <PageRow>
            <ContainerQuery>
              <Heading size="lg" mb={4}>
                Hai selamat datang role Anda adalah {activeRoleName}
              </Heading>
            </ContainerQuery>
          </PageRow>
        </PageTransition>
      </Box>
    </Flex>
  );
};

export default withAuth(DashboardPage);
