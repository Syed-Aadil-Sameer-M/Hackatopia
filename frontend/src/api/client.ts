import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

const localApiBaseUrl = 'http://localhost:8000/v1'

let authToken: string | null = null

export class ApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const statusMessages: Record<number, string> = {
  400: 'The request could not be understood.',
  401: 'Authentication is required or has expired.',
  403: 'You are not authorized to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current resource state.',
  422: 'The request contains invalid data.',
  500: 'The server encountered an error.',
}

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null
    const message =
      status === null
        ? 'Unable to reach the API.'
        : statusMessages[status] ?? 'The API request failed.'

    return new ApiError(message, status)
  }

  return new ApiError('An unexpected API error occurred.', null)
}

function configureRequest(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`)
  } else {
    config.headers.delete('Authorization')
  }

  if (
    typeof FormData !== 'undefined' &&
    config.data instanceof FormData
  ) {
    config.headers.delete('Content-Type')
  } else {
    config.headers.set('Content-Type', 'application/json')
  }

  return config
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || localApiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function setAuthToken(token: string | null): void {
  authToken = token?.trim() || null
}

apiClient.interceptors.request.use(configureRequest)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeApiError(error)),
)
