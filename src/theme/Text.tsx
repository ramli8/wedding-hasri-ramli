import { ComponentStyleConfig, defineStyle } from "@chakra-ui/react";
import { Figtree, Poppins } from "next/font/google";
import { isFirefox } from "react-device-detect";

const figtree1 = Figtree({ weight: ["500"], subsets: ["latin"] });
const figtree2 = Figtree({ weight: ["400"], subsets: ["latin"] });

const Text: ComponentStyleConfig = {
	baseStyle: defineStyle({
		"--color": "text.dark",
		color: "var(--color)",
		_dark: {
			"--color": "text.light",
		},
	}),

	variants: {
		"sidebar-item": {
			fontWeight: "400",
		},
		subtitle: {
			fontWeight: "400",
			letterSpacing: "-0.2px",
			_dark: {
				color: "#d9d9d9",
			},
		},
		tabletitle: {
			fontWeight: "500",
			color: "#1e1e1e",
			_dark: {
				color: "#ffffff",
			},
		},
		tabletext: {
			fontWeight: "500",
			fontSize: "14px",
			color: "#1e1e1e",
			_dark: {
				color: "#ffffff",
			},
		},
		toptitle: {
			fontFamily: figtree1.style.fontFamily,
			letterSpacing: isFirefox ? "0.15px" : "1px",
		},
		cardtitle: {
			fontWeight: "600",
			fontSize: "16px",
		},
		webname: {
			fontFamily: figtree2.style.fontFamily,
			letterSpacing: isFirefox ? "0.15px" : "1px",
		},
		texttitle: {
			fontSize: "18px",
			fontWeight: 600,
		},
		textsubtitle: {
			fontSize: "16px",
			fontWeight: 500,
			color: "gray",
		},
	},
};

export default Text;
