import { Box } from "@chakra-ui/react";

export const MaterialIcon = ({
	name,
	variant = "rounded", // outlined, rounded, sharp
	size = 24,
	weight = 600,
	fill = 0,
	color = "currentColor",
	pointerEvents,
}: {
	name: string;
	variant?: "outlined" | "rounded" | "sharp";
	size?: number;
	weight?: number;
	fill?: number;
	color?: string;
	pointerEvents?: string;
}) => {
	return (
		<Box
			as="span"
			className={`material-symbols-${variant}`}
			sx={{
				fontSize: `${size}px`,
				color: color,
				fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 48`,
				pointerEvents: pointerEvents,
			}}
		>
			{name}
		</Box>
	);
};
