import { menuItem, menuItemMaster, menuItemInsights } from "@/data/menu";
import AppSettingContext from "@/providers/AppSettingProvider";
import {
  Box,
  Button,
  Center,
  Flex,
  Icon,
  Link,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { useContext } from "react";
import AccountInfoContext from "@/providers/AccountInfoProvider";
import { CloseIconMade, MyITSLogo } from "../atoms/IconsMade";
import SidebarItem from "../molecules/SidebarItem";
import PermissionAPI from "@/modules/admin/permissions/services/PermissionAPI";
import { useEffect, useState } from "react";




const Sidebar = () => {
  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);

  const { colorMode } = useColorMode();

  // Get real account info from context
  const accountInfo = useContext(AccountInfoContext);

  // Permission logic
  const permissionAPI = new PermissionAPI();
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!accountInfo?.activeRole) return;
      try {
        const perms = await permissionAPI.getRolePermissions(accountInfo.activeRole);
        const urls = perms.map(p => p.url_pattern);
        setAllowedUrls(urls);
      } catch (e) {
        console.error('Failed to fetch permissions', e);
      }
    };
    fetchPermissions();
  }, [accountInfo?.activeRole]);

  const hasAccess = (url: string) => {
    if (allowedUrls.includes('*')) return true;
    return allowedUrls.some(pattern => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return url.startsWith(prefix);
      }
      return pattern === url;
    });
  };

  return (
    <>
      <Flex
        className="sidebar"
        w={{ base: "300px", m: isNavbarOpen ? "300px" : "108px", d: "280px" }}
        minW={{
          base: "300px",
          m: isNavbarOpen ? "300px" : "108px",
          d: "280px",
        }}
        pos="fixed"
        flexShrink="0"
        zIndex="20"
        display="flex"
        h="100vh"
        padding={{ base: "116px 0 0px", m: "140px 0 0px" }}
        bg={colorMode == "light" ? "#fff" : "#141414"}
        borderRight={
          colorMode == "light"
            ? "1px solid #e4e4e4"
            : "1px solid rgba(228, 228, 228, 0.1)"
        }
        transform={{
          base: isNavbarOpen ? "translateX(0%)" : "translateX(-100%)",
          m: "unset",
        }}
        transition="transform .25s, width .25s"
      >
        <Box
          className="sidebar__top"
          pos="absolute"
          top="0"
          left="0"
          right="0"
          display="flex"
          justifyContent="center"
          alignContent="center"
          h={{ base: "96px", m: "140px" }}
          borderBottom={{
            base:
              colorMode == "light"
                ? "1px solid #e4e4e4"
                : "1px solid rgba(228, 228, 228, 0.1)",
            m: "unset",
          }}
        >
          <Flex
            justifyContent="center"
            alignItems="center"
            bg="none"
            mt="5px"
            visibility={{ base: "visible", m: "hidden", d: "visible" }}
          >
            <Button
              className="sidebar__close"
              display={{ base: "inline-block", m: "none" }}
              top="1px"
              mr="0px"
              pos="relative"
              fontSize="0"
              ml="-60px"
              onClick={navbarToggler}
              bg="none"
              _hover={{
                background: "none",
              }}
            >
              <CloseIconMade
                fontSize="16px"
                color={colorMode == "light" ? "#141414" : "#fff"}
              ></CloseIconMade>
            </Button>
          </Flex>
          <Flex
            justifyContent="center"
            alignItems="center"
            maxW="184px"
            mt="8px"
            visibility={{ base: "visible" }}
          >
            <Box>
              <Center>
                <MyITSLogo
                  w={{ base: "68px", d: "86px" }}
                  h="auto"
                  color={colorMode === "light" ? "#013880" : "white"}
                />
              </Center>
              <Center>
                <Text
                  fontSize={{ base: "13px", d: "16px" }}
                  fontWeight={600}
                  textAlign="center"
                  lineHeight={1.2}
                  mt="4px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  maxW={{ base: "96px", d: "full" }}
                  title={process.env.NEXT_PUBLIC_APP_NAME}
                >
                  {process.env.NEXT_PUBLIC_APP_NAME}
                </Text>
              </Center>
            </Box>
          </Flex>
        </Box>
        <Box
          className="sidebar__wrapper"
          maxH="100%"
          padding="0 20px 30px"
          overflowY="auto"
          sx={{
            "::-webkit-scrollbar": {
              width: "20px",
              height: "20px",
              backgroundColor: "transparent",
            },
            "::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "::-webkit-scrollbar-thumb": {
              backgroundColor: colorMode == "light" ? "#dadada" : "#313131",
              borderRadius: "20px",
              border: "6px solid transparent",
              backgroundClip: "content-box",
            },
            "::-webkit-scrollbar-thumb:hover": {
              backgroundColor: colorMode == "light" ? "#b3b3b3" : "#393939",
            },
          }}
          overflowX="hidden"
        >
          <Box
            className="sidebar__inner"
            width={{
              base: "256px",
              m: isNavbarOpen ? "256px" : "64px",
              d: "240px",
            }}
            overflow="hidden"
            transition="width .25s"
          >
            <Box className="sidebar__list" mb="20px">
              <Box
                className="sidebar__group"
                _notLast={{
                  position: "relative",
                  marginBottom: "40px",
                  paddingBottom: "30px",
                  _before: {
                    content: '""',
                    position: "absolute",
                    left: "20px",
                    right: "20px",
                    bottom: 0,
                    height: "1px",
                    background: colorMode == "light" ? "#f0f3f6" : "#292929",
                  },
                }}
              >
                <Box
                  display={{ base: "flex", d: "box" }}
                  className="sidebar__caption"
                  fontSize="12px"
                  fontWeight="500"
                  lineHeight="1.33333333"
                  mb="16px"
                  justifyContent={{
                    base: "start",
                    m: "center",
                    d: "flex-start",
                  }}
                  alignItems={{ base: "start", m: "center", d: "start" }}
                  pl={{ base: "20px", m: "0px", d: "20px" }}
                  color="#808191"
                  transition=".25s"
                >
                  Menu
                </Box>
                <Box className="sidebar__menu">

                  {menuItem
                    .filter(({ isShown }) => !isShown || isShown(accountInfo))
                    .filter(item => hasAccess(item.url))
                    .map((item, index) => (
                      <SidebarItem
                        menuItem={item}
                        menuIndex={index}
                        key={"main-menu-item-" + index}
                      />
                    ))}
                </Box>
              </Box>
              <Box
                className="sidebar__group"
                _notLast={{
                  position: "relative",
                  marginBottom: "40px",
                  paddingBottom: "30px",
                  _before: {
                    content: '""',
                    position: "absolute",
                    left: "20px",
                    right: "20px",
                    bottom: 0,
                    height: "1px",
                    background: colorMode == "light" ? "#f0f3f6" : "#292929",
                  },
                }}
              >
                <Box
                  display={{ base: "flex", d: "box" }}
                  className="sidebar__caption"
                  fontSize="12px"
                  fontWeight="500"
                  lineHeight="1.33333333"
                  mb="16px"
                  justifyContent={{
                    base: "start",
                    m: "center",
                    d: "flex-start",
                  }}
                  alignItems={{ base: "start", m: "center", d: "start" }}
                  pl={{ base: "20px", m: "0px", d: "20px" }}
                  color="#808191"
                  transition=".25s"
                >
                  Master
                </Box>
                <Box className="sidebar__menu">
                  {menuItemMaster
                    .filter(item => hasAccess(item.url))
                    .map((item, index) => (
                    <SidebarItem
                      menuItem={item}
                      menuIndex={index}
                      key={"master-menu-item-" + index}
                    />
                  ))}
                </Box>
              </Box>
              <Box
                className="sidebar__group"
                _notLast={{
                  position: "relative",
                  marginBottom: "40px",
                  paddingBottom: "30px",
                  _before: {
                    content: '""',
                    position: "absolute",
                    left: "20px",
                    right: "20px",
                    bottom: 0,
                    height: "1px",
                    background: colorMode == "light" ? "#f0f3f6" : "#292929",
                  },
                }}
              >
                <Box
                  display={{ base: "flex", d: "box" }}
                  className="sidebar__caption"
                  fontSize="12px"
                  fontWeight="500"
                  lineHeight="1.33333333"
                  mb="16px"
                  justifyContent={{
                    base: "start",
                    m: "center",
                    d: "flex-start",
                  }}
                  alignItems={{ base: "start", m: "center", d: "start" }}
                  pl={{ base: "20px", m: "0px", d: "20px" }}
                  color="#808191"
                  transition=".25s"
                >
                  Insights
                </Box>
                <Box className="sidebar__menu">

                  {menuItemInsights
                    .filter(item => hasAccess(item.url))
                    .map((item, index) => (
                    <SidebarItem
                      menuItem={item}
                      menuIndex={index}
                      key={"main-menu-item-" + index}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Flex>
      <Box
        display={{ base: isNavbarOpen ? "flex" : "none", m: "none" }}
        pos="absolute"
        h="full"
        w="100%"
        bg="none"
        zIndex="15"
        onClick={navbarToggler}
      ></Box>
    </>
  );
};

export default Sidebar;
