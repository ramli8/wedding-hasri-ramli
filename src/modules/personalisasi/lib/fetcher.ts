import { apiEndpointEndMap, apiEndpointMap } from '@/config/ApiEndpoint'
import axios from 'axios'

export type Response<T> = {
	code: number
	message: string
	data: T
}

export type InfiniteScrollResponse<T> = Response<T> & {
	links: { next: string }
	meta: {
		total: number
	}
}

const fetcherBase = axios.create({
	baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080',
	xsrfCookieName: 'CSRF-TOKEN',
	xsrfHeaderName: 'X-CSRF-TOKEN',
	withXSRFToken: true,
	withCredentials: true,
})

const fetcherGetBackend = async <T = any>(key: string, params?: any) =>
	await fetcherBase
		.get<Response<T>>(
			apiEndpointMap.get(key) ?? '',
			{ params: params }
		)
		.then((res) => res.data.data)

const fetcherGetBackendInfinite = async <T = any>(key: string, params?: any) =>
	await fetcherBase
		.get(
			apiEndpointMap.get(key) ?? '',
			{ params: params }
		)
		.then((res) => {
			return {
				data: res.data.data,
				next: res.data.links.next,
				total: res.data.meta.total
			}
		})

const fetcherGetDetailBackend = async <T = any>(key: string, id: string | string[] | undefined) => {
	const endpoint = apiEndpointMap.get(key)

	if (id && endpoint) {
		return await fetcherBase
			.get<Response<T>>(
				endpoint + id,
			)
			.then((res) => res.data.data)
	}
}

const fetcherGetDetailAlternateBackend = async <T = any>(key: string, id: string | string[] | undefined) => {
	const endpoint = apiEndpointMap.get(key)
	const endpointEnd = apiEndpointEndMap.get(key)

	if (id && endpoint) {
		return await fetcherBase
			.get<Response<T>>(
				endpoint + id + endpointEnd,
			)
			.then((res) => res.data.data)
	}
}

const fetcherGetCustomBackend = async <T = any>(endpoint: string) => {
	return await fetcherBase
		.get<Response<T>>(
			endpoint,
		)
		.then((res) => res.data.data)
}

const fetcherGetParamsBackend = async <T = any>(key: string, params: any) => {
	let checkParams = Object.values(params).some(p => (p === null || p === ""))
	if (checkParams) return []

	const urlParams = new URLSearchParams(params).toString()

	return await fetcherBase
		.get((apiEndpointMap.get(key) ?? '') + "?" + urlParams)
		.then((result) => result.data.data ?? [])
}

export { fetcherBase, fetcherGetBackend, fetcherGetBackendInfinite, fetcherGetDetailAlternateBackend, fetcherGetDetailBackend, fetcherGetCustomBackend, fetcherGetParamsBackend }
