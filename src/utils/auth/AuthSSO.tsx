import Sidebar from "@/components/organisms/Sidebar";
import { AccountInfoProvider } from "@/providers/AccountInfoProvider";
import AppSettingContext from "@/providers/AppSettingProvider";
import AuthContext from "@/providers/AuthProvider";
import { Box, Flex, useColorMode } from "@chakra-ui/react";
import { Inter } from "next/font/google";
import { ReactNode, useContext, useEffect } from "react";
import { useSignInAction } from "./SignInAction";

const inter = Inter({ subsets: ["latin"] });

const AuthSSO = ({ children }: { children: ReactNode }) => {
	const { hasAccess, status } = useContext(AuthContext);
	const { isLoading } = useContext(AppSettingContext);
	const { colorMode } = useColorMode();
	const { signIn } = useSignInAction();

	useEffect(() => {
		status === "unauthenticated" && isLoading === false && signIn();
	}, [status, isLoading]);

	if (status === "authenticated" && !isLoading) {
		if (hasAccess) {
			return (
				<>
					<AccountInfoProvider>
						<Flex className="page" flexDirection="column" minH="100vh">
							<Sidebar />
							<Box
								className="page__wrapper"
								flexGrow="1"
								pl={{ base: "0px", m: "107px", d: "280px" }}
								transition="all .25s"
								overflow="hidden"
								pt={{ base: "96px", m: "unset" }}
							>
								<Box
									className="page__center"
									w={{ base: "100%", x: "unset" }}
									maxW={{ base: "930px", x: "1360px" }}
									m="0 auto"
									p={{
										base: "0 16px 32px",
										m: "0 32px 40px",
										t: "0 70px 40px",
										x: "unset",
									}}
								>
									{children}
								</Box>
							</Box>
						</Flex>
					</AccountInfoProvider>
				</>
			);
		} else {
			return <>{"Gada akses :)"}</>;
		}
	}

	return (
		<>
			{colorMode !== undefined && (
				<div style={{}}>
					<div
						id="globalLoader"
						style={{
							display: "flex",
							zIndex: "99",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								display: "flex",
								zIndex: "99",
								overflow: "hidden",
							}}
						>
							<div
								className={inter.className}
								id="text-loading"
								style={{
									fontSize: "2rem",
									marginLeft: "10px",
									fontWeight: "600",
								}}
							>
								{process.env.NEXT_PUBLIC_APP_NAME_FULL}
							</div>
						</div>
						<div className="dot-flashing" style={{ marginTop: "14px" }}></div>
					</div>
				</div>
			)}
		</>
	);
};

export { AuthSSO };
