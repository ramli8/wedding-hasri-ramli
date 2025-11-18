import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
	createMultiStyleConfigHelpers(menuAnatomy.keys);

const baseStyle = definePartsStyle({
	list: {
		borderRadius: "24px",
		p: "16px",
		borderWidth: "1px",
		borderStyle: "solid",
		_light: {
			borderColor: "gray.100",
			bg: "white",
			boxShadow: "0 4px 16px rgba(227, 230, 236, 0.4)",
		},
		_dark: {
			borderColor: "gray.800",
			bg: "gray.900",
			boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15))",
		},
	},
	item: {
		fontSize: "14px",
		fontWeight: "600",
		p: "16px 12px",
		bg: "transparent",
		borderRadius: "16px",
		transition: ".25s all",
		_light: {
			_hover: {
				bg: "gray.50",
			},
		},
		_dark: {
			_hover: {
				bg: "gray.800",
			},
		},
	},
	divider: {
		borderWidth: "1px",
		borderStyle: "solid",
		_light: {
			borderColor: "gray.100",
		},
		_dark: {
			borderColor: "gray.800",
		},
	},
});
export const menuTheme = defineMultiStyleConfig({ baseStyle });
