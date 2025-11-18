import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } =
	createMultiStyleConfigHelpers(parts.keys);

const baseStyle = definePartsStyle({
	dialogContainer: {
		"&::-webkit-scrollbar": {
			width: "20px",
		},
		"&::-webkit-scrollbar-thumb": {
			borderRadius: "20px",
			borderWidth: "6px",
			borderStyle: "solid",
			backgroundClip: "content-box",
		},
		_light: {
			"&::-webkit-scrollbar": {
				background: "#828383",
			},
			"&::-webkit-scrollbar-track": {
				background: "#828383",
			},
			"&::-webkit-scrollbar-thumb": {
				background: "#dadada",
				borderColor: "#828383",
			},
			"&::-webkit-scrollbar-thumb:hover": {
				background: "#b3b3b3",
			},
		},
		_dark: {
			"&::-webkit-scrollbar": {
				background: "#0a0a0a",
			},
			"&::-webkit-scrollbar-track": {
				background: "#0a0a0a",
			},
			"&::-webkit-scrollbar-thumb": {
				background: "#313131",
				borderColor: "#0a0a0a",
			},
			"&::-webkit-scrollbar-thumb:hover": {
				background: "#393939",
			},
		},
	},
	dialog: {
		borderRadius: "24px",
		_light: { bg: "white" },
		_dark: { bg: "gray.900" },
	},
	closeButton: {
		borderRadius: "16px",
		p: "24px",
	},
});

export const modalTheme = defineMultiStyleConfig({
	baseStyle,
});
