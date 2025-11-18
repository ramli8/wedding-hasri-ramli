/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	output: 'standalone',
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'dev-my.its.ac.id',
				port: '',
				pathname: '/sso/user/*/picture',
			},
			{
				protocol: 'https',
				hostname: 'my.its.ac.id',
				port: '',
				pathname: '/sso/user/*/picture',
			},
		],
	},
}

module.exports = nextConfig
