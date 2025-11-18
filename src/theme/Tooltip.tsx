import { defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
	fontWeight: "500",
	fontSize: "12px",
	color: "#141414",
	bg: "white",
	borderRadius: "8px",
};

export const tooltipTheme = defineStyleConfig({ baseStyle });
