import AppSettingContext from '@/providers/AppSettingProvider';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import AuthAPI from '@/modules/auth/services/AuthAPI';
import PermissionAPI from '@/modules/admin/permissions/services/PermissionAPI';
import { useSignOutAction } from '@/utils/SignOutAction';
import {
  Box,
  Button,
  Center,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FormEventHandler,
  ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import { mutate } from 'swr';
import defaultProfilePicture from '../../public/images/app/profile-default.jpg';
import { PrimarySubtleBadge } from './atoms/BadgeStatus/PrimaryBadge';
import { DaliGhostButton } from './atoms/Buttons/DaliButton';
import { PrimaryButton } from './atoms/Buttons/PrimaryButton';
import {
  ArrowLeftOutlineIconMade,
  CheckmarkOutlineIconMade,
  ChevronRightSolidIconMade,
  CloseOutlineIconMade,
  LogoutOutlineIconMade,
  MyITSLogo,
  UsersOutlineIconMade,
} from './atoms/IconsMade';
import DropdownSelect from './molecules/Select';
import ToastCard from './molecules/ToastCard';
import { MotionBox } from './motion/Motion';

const titledMenu = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

const PageTransition = ({
  pageTitle,
  previousPage,
  previousPageTitle,
  children,
}: {
  pageTitle?: string;
  previousPage?: string;
  previousPageTitle?: string;
  children: ReactNode;
}) => {
  const page = useRouter().route;
  const router = useRouter();
  const n = page.lastIndexOf('/');
  const r = page.substring(n + 1);

  // Add permission fetching logic
  const permissionAPI = new PermissionAPI();
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const accountInfo = useContext(AccountInfoContext); // Moved up for use in useEffect
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!accountInfo?.activeRole) return;
      try {
        const perms = await permissionAPI.getRolePermissions(
          accountInfo.activeRole
        );
        const urls = perms.map((p) => p.url_pattern);
        setAllowedUrls(urls);
      } catch (e) {
        console.error('Failed to fetch permissions', e);
      }
    };
    fetchPermissions();
  }, [accountInfo?.activeRole]);

  const hasAccess = (url: string) => {
    if (allowedUrls.includes('*')) return true;
    return allowedUrls.some((pattern) => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return url.startsWith(prefix);
      }
      return pattern === url;
    });
  };
  // Use AuthAPI for logout
  const authAPI = new AuthAPI();
  const handleLogout = () => {
    authAPI.logout();
    router.push('/admin/login');
  };

  const { colorMode, toggleColorMode } = useColorMode();
  useEffect(() => {
    document
      .querySelector('body')
      ?.classList.add(colorMode == 'light' ? 'light' : 'dark');
    document
      .querySelector('body')
      ?.classList.remove(colorMode == 'light' ? 'dark' : 'light');
  });

  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);

  const {
    isOpen: isOpenGantiRole,
    onOpen: onOpenGantiRole,
    onClose: onCloseGantiRole,
  } = useDisclosure();

  // Get real account info from context

  const t = useTranslations('PageLayout');
  const commonTranslations = useTranslations('Common');

  // Mengatur animasi header agar muncul dan sembunyi versi mobile
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const hideAt = 96; //Pixel scroll untuk mulai menyembunyikan header

  const controlNavbar = () => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > hideAt && window.scrollY > lastScrollY) {
        setShow(false);
      } else if (window.scrollY < lastScrollY || window.scrollY <= hideAt) {
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  //Scroll ke atas untuk header versi mobile
  const [isVisible, setIsVisible] = useState(false);

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    setIsVisible(scrollTop > 400);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <Head>
        <title>
          {(pageTitle ? pageTitle + ' • ' : '') +
            process.env.NEXT_PUBLIC_APP_NAME_FULL}
        </title>
      </Head>
      <Flex
        className="page__row page__row_head"
        flexDirection={{ base: 'column-reverse', t: 'initial' }}
        m={{ base: '0', x: '0 0px', w: '0' }}
        p={{ base: '0px 0 0px 0', x: '0px 0', w: '0' }}
      >
        {/* Title col */}
        <Box
          className="page__col"
          p={{ base: '16px 16px 28px', x: '0 24px 44px 24px' }}
          // Reduced padding top for mobile because new header is compact
          pt={{ base: '20px', m: '48px' }}
          w="100%"
          display={{ base: 'block', md: 'flex' }}
          alignItems="center"
          flexWrap="wrap"
          gap={3}
        >
          {previousPage && (
            <>
              <Link href={previousPage}>
                <Text
                  display={['none', 'none', 'none', 'block']}
                  className="page__title"
                  fontSize={{ base: '24px', m: '28px', x: '30px' }}
                  lineHeight="1.33333"
                  fontWeight="600"
                  variant="toptitle"
                  opacity="0.6"
                  _hover={{
                    opacity: 1,
                  }}
                  transition="120ms ease-out"
                >
                  {previousPageTitle}
                </Text>
              </Link>
              <Flex
                opacity="0.6"
                mx="-2px"
                display={['none', 'none', 'none', 'flex']}
              >
                <ChevronRightSolidIconMade fontSize="24px" />
              </Flex>
            </>
          )}

          <Flex alignItems="center">
            <Flex
              alignItems="center"
              justifyContent="center"
              mr="2px"
              ml="0"
              w="0"
              h="36px"
              display="none"
              onClick={() => router.back()}
            >
              <ArrowLeftOutlineIconMade fontSize="24px" />
            </Flex>
            <Flex alignItems="center" minH="36px">
              <Text
                className="page__title"
                fontSize={{ base: '24px', m: '28px', x: '30px' }}
                lineHeight="1.33333"
                fontWeight="600"
                variant="toptitle"
              >
                {pageTitle}
              </Text>
            </Flex>
          </Flex>
        </Box>

        <Box
          className="page__col"
          p={{ base: '16px 16px 28px', x: '0 24px 44px' }}
          pt={{ base: '0', t: '48px', x: '48px' }}
          _first={{
            flex: { base: '100%', t: 'calc(100% - 200px)' },
            maxWidth: { base: '100%', t: 'calc(100% - 200px)' },
          }}
          _even={{
            flexShrink: '0',
            width: { base: '100%', t: '200px' },
          }}
        >
          {/* Hide Menu on mobile since AdminLayout handles it, but keep the column for desktop */}
          <Menu closeOnSelect={false}>
            <MenuButton
              className="header__user"
              cursor="pointer"
              // Hide on mobile, show on tablet and above
              display={{ base: 'none', m: 'block' }}
              flexShrink="0"
              w="40px"
              h="40px"
              ml={{ base: '0', m: '24px' }}
              fontSize="0"
              backgroundSize="contain"
              borderRadius="50%"
              position={'relative'}
              overflow={'hidden'}
            >
              <Image
                src={accountInfo?.profPicture ?? defaultProfilePicture}
                alt={t('profile_picture_of', {
                  name: accountInfo?.name ?? t('user'),
                })}
                width={40}
                height={40}
                placeholder="blur"
                blurDataURL={defaultProfilePicture.blurDataURL}
              />
            </MenuButton>
            <MenuList
              defaultChecked={false}
              w={{ base: 'calc(100vw - 32px)', s: '350px' }}
              transition="all .25s"
              mx={{ base: '16px', s: 'unset' }}
            >
              <Box p="1rem 0.75rem">
                <Text fontSize="16px" fontWeight="600">
                  {accountInfo?.name ?? 'Demo User'}
                </Text>
                <Text fontSize="14px" fontWeight="500" color="gray" mt="6px">
                  {accountInfo?.prefUsername ?? 'demo@example.com'}
                </Text>
                {accountInfo?.activeRole && (
                  <Text fontSize="14px" fontWeight="500" color="gray" mt="6px">
                    {accountInfo?.role?.find(
                      (r: any) => r.id === accountInfo?.activeRole
                    )?.name ?? 'Role'}
                  </Text>
                )}
              </Box>
              {accountInfo?.role && accountInfo?.role.length > 1 && (
                <>
                  <MenuDivider mx=".75rem" />
                  <MenuItem
                    icon={<UsersOutlineIconMade fontSize="18px" />}
                    onClick={onOpenGantiRole}
                  >
                    {commonTranslations('switch_role')}
                  </MenuItem>
                </>
              )}
              <MenuDivider mx=".75rem" />
              <MenuItem
                icon={<LogoutOutlineIconMade fontSize="18px" />}
                color={colorMode == 'light' ? 'red.500' : 'redDim.500'}
                onClick={handleLogout}
              >
                {commonTranslations('sign_out')}
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Flex>
      <MotionBox
        className="page__motion"
        variants={titledMenu}
        initial="initial"
        animate="animate"
        exit="exit"
        // @ts-ignore
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
          delay: 0,
        }}
      >
        {children}
      </MotionBox>

      <ModalGantiRole isOpen={isOpenGantiRole} onClose={onCloseGantiRole} />
    </>
  );
};

const ModalGantiRole = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { colorMode } = useColorMode();
  const accountInfo = useContext(AccountInfoContext);
  const commonTranslations = useTranslations('Common');
  const router = useRouter();

  // Role stuff
  const toast = useToast();
  const roles =
    accountInfo?.role?.map((role: any) => ({
      label: role.name,
      value: role.id,
    })) || [];
  const activeRole = accountInfo?.activeRole;
  const formId = useId();
  const [isSwitchingRole, setSwitchingRole] = useState(false);

  const handleChangeRole: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRoleId = formData.get('role') as string;

    if (!newRoleId || newRoleId === activeRole) {
      onClose();
      return;
    }

    setSwitchingRole(true);

    try {
      // Save new active role to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_role_id', newRoleId);
      }

      toast({
        title: 'Role berhasil diganti',
        status: 'success',
        duration: 2000,
      });

      // Redirect to dashboard with full page reload
      window.location.href = '/admin/dashboard';
    } catch (error) {
      toast({
        title: 'Gagal mengganti role',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSwitchingRole(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent
        borderRadius="16px"
        py="8px"
        m="16px 24px"
        bg={useColorModeValue('white', 'gray.900')}
      >
        <ModalHeader
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          {commonTranslations('switch_role')}
        </ModalHeader>

        {/* @ts-expect-error */}
        <ModalBody as="form" onSubmit={handleChangeRole} id={formId}>
          <Box w="full">
            <DropdownSelect
              placeholder={
                roles.length === 0
                  ? 'Tidak ada role yang tersedia'
                  : 'Pilih role'
              }
              defaultValue={activeRole}
              name="role"
              options={roles}
              isDisabled={roles.length === 0 || isSwitchingRole}
              isMulti={false}
              isClearable={false}
            />
          </Box>
        </ModalBody>
        <ModalFooter display="flex" pt="24px" gap={2}>
          <Center w={{ base: 'full', s: 'auto' }}>
            <DaliGhostButton onClick={onClose}>
              {commonTranslations('cancel')}
            </DaliGhostButton>
          </Center>
          <Center w={{ base: 'full', s: 'auto' }}>
            <PrimaryButton
              type="submit"
              form={formId}
              isLoading={isSwitchingRole}
            >
              {commonTranslations('save')}
            </PrimaryButton>
          </Center>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PageTransition;
