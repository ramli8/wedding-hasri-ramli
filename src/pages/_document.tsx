/**
 * @file _document.tsx
 * @description This is the document component. It is used to wrap the document with the providers.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import theme from "@/theme/theme";
import { ColorModeScript } from "@chakra-ui/react";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<link href="/styles/material_symbols_outlined.css" rel="stylesheet" />
				<link href="/styles/material_symbols_sharp.css" rel="stylesheet" />
				<link href="/styles/material_symbols_rounded.css" rel="stylesheet" />
			</Head>
			<body>
				<ColorModeScript initialColorMode={theme.config.initialColorMode} />
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
