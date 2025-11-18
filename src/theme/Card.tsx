import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
	createMultiStyleConfigHelpers(cardAnatomy.keys);

const baseStyle = definePartsStyle({
	container: {
		baseStyle: {},

		_light: {
			bg: "#ffffff",
		},
		_dark: {
			bg: "#212121",
		},
	},
	header: {
		paddingBottom: "2px",
	},
	body: {
		paddingTop: "2px",
	},
	footer: {
		paddingTop: "4px",
	},
});

export const cardTheme = defineMultiStyleConfig({
	baseStyle,
});
