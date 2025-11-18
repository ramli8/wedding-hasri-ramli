/**
 * @file ModalProvider.tsx
 * @description Provides a context for modal state. This is an example of how to use the Modal. Each modal should have its own state.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import {
	Dispatch,
	ReactNode,
	SetStateAction,
	createContext,
	useState,
} from "react";

interface ModalContextType {
	isModalActive: boolean | null;
	setIsModalActive: Dispatch<SetStateAction<boolean>>;
}

const ModalContextDefault: ModalContextType = {
	isModalActive: false,
	setIsModalActive: () => false,
};

const ModalContext = createContext<ModalContextType>(ModalContextDefault);

export function ModalContextProvider({ children }: { children: ReactNode }) {
	const [isModalActive, setIsModalActive] = useState<boolean>(false);

	return (
		<ModalContext.Provider value={{ isModalActive, setIsModalActive }}>
			{children}
		</ModalContext.Provider>
	);
}

export default ModalContext;
