/**
 * @file AppSettingProvider.tsx
 * @description This is the app setting provider. It is used to provide the app setting to the app.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import {
	AppSettingContextType,
	ColorPreference,
	LanguagePreference
} from "@/types/app-setting";
import { useDisclosure } from "@chakra-ui/react";
import { ReactNode, createContext, useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";

const appSettingContextDefault: AppSettingContextType = {
	langPref: "id",
	colorPref: 'blue',
	isNavbarOpen: true,
	markerActive: 0,
	markerTemp: -1,
	parentActive: 0,
	parentTemp: 0,
	isLoading: true,
	cardWidth: "50%",
	cardWidthWidget: "50%",
};

const fetcherLocal = (key: string) => localStorage?.getItem(key);

const AppSettingContext = createContext<AppSettingContextType>(
	appSettingContextDefault
);

export function AppSettingProvider({ children }: { children: ReactNode }) {
	const { data: isNavbarOpenLocal } = useSWRImmutable(
		"is_navbar_open",
		fetcherLocal
	);
	const {
		isOpen: isNavbarOpen,
		onToggle: toggleNavbar,
		onOpen,
		onClose,
	} = useDisclosure();

	const [colorPref, setColorPref] = useState<ColorPreference>(appSettingContextDefault.colorPref)
	const [cardWidth, setCardWidth] = useState("50%");
	const [cardWidthWidget, setCardWidthWidget] = useState("50%");

	const [langPref, setLangPref] = useState<LanguagePreference>("id");

	const [markerActive, setMarkerActive] = useState<number>(0);
	const [markerTemp, setMarkerTemp] = useState<number>(-1);
	const [parentActive, setParentActive] = useState<number>(0);
	const [parentTemp, setParentTemp] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// ********** EFFECTS ********** //
	// Get Preferences from Local Storage
	useEffect(() => {
		if (isNavbarOpenLocal) {
			isNavbarOpenLocal == "true" ? onOpen() : onClose();
			setTimeout(() => setIsLoading(false), 400);
		} else {
			setTimeout(() => setIsLoading(false), 400);
		}
	}, [isNavbarOpenLocal, onOpen, onClose]);

	// ********** FUNCTIONS ********** //
	// Set Browser Settings in Local Storage
	const navbarToggler = () => {
		if (typeof window !== 'undefined') {
			if (isNavbarOpen) {
				localStorage.setItem("is_navbar_open", "false");
			} else {
				localStorage.setItem("is_navbar_open", "true");
			}
		}
		toggleNavbar();
	};

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const savedColorPref = localStorage.getItem('color_pref')
		if (!savedColorPref) return
		setColorPref(savedColorPref as ColorPreference)
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const savedLangPref = localStorage.getItem('lang_pref')
		if (!savedLangPref) return
		setLangPref(savedLangPref as LanguagePreference)
	}, [])

	return (
		<AppSettingContext.Provider
			value={{
				colorPref,
				langPref,
				isNavbarOpen,
				markerActive,
				markerTemp,
				isLoading,
				cardWidth,
				cardWidthWidget,
				parentActive,
				parentTemp,

				navbarToggler,
				setMarkerActive,
				setMarkerTemp,
				setParentActive,
				setParentTemp,
				setCardWidth,
				setCardWidthWidget,
				setLangPref,
				setColorPref,
			}}
		>
			{children}
		</AppSettingContext.Provider>
	);
}

export default AppSettingContext;
