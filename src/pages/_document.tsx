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
				
				{/* PWA Manifest */}
				<link rel="manifest" href="/site.webmanifest" />
				
				{/* Icons */}
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				
				{/* PWA Meta Tags */}
				<meta name="application-name" content="Wedding App" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content="Wedding App" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="theme-color" content="#013880" />
				<meta name="msapplication-TileColor" content="#013880" />
				<meta name="msapplication-tap-highlight" content="no" />
			</Head>
			<body>
				<ColorModeScript initialColorMode={theme.config.initialColorMode} />
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
