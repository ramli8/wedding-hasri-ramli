import { ThemeComponents, cssVar, defineStyleConfig } from '@chakra-ui/react';
import { keyframes } from '@chakra-ui/system';

const placeholderAnimation = keyframes({
	from: {
		opacity: 1,
	},
	to: {
		opacity: 0.2,
	},
});

const $startColor = cssVar('skeleton-start-color')
const $endColor = cssVar('skeleton-end-color')

const Skeleton: ThemeComponents = {
	Skeleton: defineStyleConfig({
		baseStyle: {
			boxShadow: 'none',
			backgroundClip: 'padding-box',
			bgColor: 'gray.-400',
			cursor: 'default',
			display: 'none',
			color: 'transparent',
			pointerEvents: 'none',
			userSelect: 'none',
			'&::before, *': {
				visibility: 'hidden',
			},
			':after': {
				content: "''",
				animation: `0.8s linear infinite alternate ${placeholderAnimation}`,
				bgColor: 'gray.-400',
				opacity: 0,
				display: 'block',
				width: 'full',
				height: 'full',
			},
		},
	},
	),
};

export default Skeleton;