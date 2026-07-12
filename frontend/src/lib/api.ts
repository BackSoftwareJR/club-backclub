import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import type {
  AdminAnalyticsResponse,
  AdminInjectionResponse,
  AiChatResponse,
  AiInterveneResponse,
  AuthResponse,
  ClubAppearancePayload,
  ClubIdentity,
  CreateClubResponse,
  EntryResponse,
  LedgerEntry,
  LegalTermsDocument,
  Member,
  MyClubsResponse,
  PaginatedResponse,
  Product,
  ProductPayload,
  PurchaseResponse,
  TopupRequest,
  TreasuryResponse,
  WalletResponse,
} from '@/types'
import { ApiRequestError, resolveApiErrorMessage } from '@/lib/apiErrors'
import { clearSession, getToken } from '@/lib/storage'

interface ApiErrorBody {
  message?: string
  error?: string
}

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false
  return url.includes('/auth/') || url.includes('/entry/')
}

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status
    const requestUrl = error.config?.url

    if (status === 401 && !isPublicAuthRequest(requestUrl) && getToken()) {
      clearSession()
    }

    const message = resolveApiErrorMessage(status, error.response?.data)
    return Promise.reject(new ApiRequestError(message, status, error.response?.data?.error))
  },
)

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config)
  return response.data
}

function imageUploadData(file: File): FormData {
  const formData = new FormData()
  formData.append('image', file)
  return formData
}

export const api = {
  entry: (clubId: number, nfcUid: string) =>
    request<EntryResponse>({ method: 'GET', url: `/entry/${clubId}/${nfcUid}` }),

  pinSetup: (body: { club_id: number; nfc_uid: string; pin: string }) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/pin-setup', data: body }),

  login: (body: { club_id: number; nfc_uid: string; pin: string }) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/login', data: body }),

  getLegalTerms: () =>
    request<{ data: LegalTermsDocument }>({ method: 'GET', url: '/legal/terms' }),

  acceptLegalTerms: (body: { club_id: number; nfc_uid: string; terms_version: string }) =>
    request<{ accepted: boolean; terms_version: string; accepted_at: string }>({
      method: 'POST',
      url: '/legal/accept',
      data: body,
    }),

  listMyClubs: () =>
    request<MyClubsResponse>({ method: 'GET', url: '/me/clubs' }),

  createClub: (body: { name: string; terms_version: string; terms_accepted: boolean }) =>
    request<CreateClubResponse>({ method: 'POST', url: '/me/clubs', data: body }),

  getWallet: (clubId: number) =>
    request<WalletResponse>({ method: 'GET', url: `/clubs/${clubId}/wallet` }),

  createTopupRequest: (clubId: number, amount: string) =>
    request<TopupRequest>({
      method: 'POST',
      url: `/clubs/${clubId}/wallet/topup-requests`,
      data: { amount },
    }),

  listTopupRequests: (clubId: number) =>
    request<PaginatedResponse<TopupRequest>>({
      method: 'GET',
      url: `/clubs/${clubId}/wallet/topup-requests`,
    }),

  getProducts: (clubId: number) =>
    request<{ data: Product[] }>({ method: 'GET', url: `/clubs/${clubId}/products` }),

  listAdminProducts: (clubId: number) =>
    request<{ data: Product[] }>({ method: 'GET', url: `/clubs/${clubId}/admin/products` }),

  purchase: (
    clubId: number,
    body: { product_id: number; quantity: number; custom_note?: string },
  ) =>
    request<PurchaseResponse>({
      method: 'POST',
      url: `/clubs/${clubId}/purchases`,
      data: body,
    }),

  aiIntervene: (
    clubId: number,
    body: { product_id: number; quantity: number; custom_note?: string | null },
  ) =>
    request<AiInterveneResponse>({
      method: 'POST',
      url: `/clubs/${clubId}/ai/intervene`,
      data: body,
    }),

  aiChat: (clubId: number, message: string) =>
    request<AiChatResponse>({
      method: 'POST',
      url: `/clubs/${clubId}/ai/chat`,
      data: { message },
    }),

  getTreasury: (clubId: number) =>
    request<TreasuryResponse>({ method: 'GET', url: `/clubs/${clubId}/admin/treasury` }),

  getAdminAnalytics: (clubId: number) =>
    request<AdminAnalyticsResponse>({ method: 'GET', url: `/clubs/${clubId}/admin/analytics` }),

  recordExpense: (clubId: number, body: { amount: string; description: string }) =>
    request<LedgerEntry>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/treasury/expense`,
      data: body,
    }),

  adminInjection: (
    clubId: number,
    body: { user_id: number; amount: string; description?: string },
  ) =>
    request<AdminInjectionResponse>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/treasury/injection`,
      data: {
        ...body,
        description: body.description?.trim() || 'Direct injection',
      },
    }),

  listAdminTopupRequests: (clubId: number, status?: string) =>
    request<PaginatedResponse<TopupRequest>>({
      method: 'GET',
      url: `/clubs/${clubId}/admin/topup-requests`,
      params: status ? { status } : undefined,
    }),

  approveTopup: (clubId: number, id: number) =>
    request<TopupRequest>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/topup-requests/${id}/approve`,
    }),

  rejectTopup: (clubId: number, id: number, admin_note: string) =>
    request<TopupRequest>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/topup-requests/${id}/reject`,
      data: { admin_note },
    }),

  listMembers: (clubId: number) =>
    request<PaginatedResponse<Member>>({
      method: 'GET',
      url: `/clubs/${clubId}/admin/members`,
    }),

  createMember: (clubId: number, body: { email: string; nfc_uid: string }) =>
    request<Member>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/members`,
      data: body,
    }),

  resetPin: (clubId: number, memberId: number) =>
    request<Member>({
      method: 'PATCH',
      url: `/clubs/${clubId}/admin/members/${memberId}/reset-pin`,
    }),

  suspendMember: (clubId: number, memberId: number) =>
    request<Member>({
      method: 'PATCH',
      url: `/clubs/${clubId}/admin/members/${memberId}/suspend`,
    }),

  revokeCard: (clubId: number, memberId: number) =>
    request<Member>({
      method: 'PATCH',
      url: `/clubs/${clubId}/admin/members/${memberId}/revoke-card`,
    }),

  createProduct: (clubId: number, body: ProductPayload) =>
    request<Product>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/products`,
      data: body,
    }),

  updateProduct: (clubId: number, productId: number, body: Partial<ProductPayload>) =>
    request<Product>({
      method: 'PATCH',
      url: `/clubs/${clubId}/admin/products/${productId}`,
      data: body,
    }),

  deleteProduct: (clubId: number, productId: number) =>
    request<{ message: string }>({
      method: 'DELETE',
      url: `/clubs/${clubId}/admin/products/${productId}`,
    }),

  uploadProductCover: (clubId: number, productId: number, file: File) =>
    request<Product>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/products/${productId}/cover`,
      data: imageUploadData(file),
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteProductCover: (clubId: number, productId: number) =>
    request<Product>({
      method: 'DELETE',
      url: `/clubs/${clubId}/admin/products/${productId}/cover`,
    }),

  uploadProductGalleryImage: (clubId: number, productId: number, file: File) =>
    request<Product>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/products/${productId}/gallery`,
      data: imageUploadData(file),
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteProductGalleryImage: (clubId: number, productId: number, mediaId: number) =>
    request<Product>({
      method: 'DELETE',
      url: `/clubs/${clubId}/admin/products/${productId}/gallery/${mediaId}`,
    }),

  reorderProductGallery: (clubId: number, productId: number, mediaIds: number[]) =>
    request<Product>({
      method: 'PATCH',
      url: `/clubs/${clubId}/admin/products/${productId}/gallery/reorder`,
      data: { media_ids: mediaIds },
    }),

  getClubIdentity: (clubId: number) =>
    request<{ data: ClubIdentity }>({
      method: 'GET',
      url: `/clubs/${clubId}/admin/identity`,
    }),

  updateClubAppearance: (clubId: number, body: ClubAppearancePayload) =>
    request<{ data: ClubIdentity }>({
      method: 'PATCH',
      url: `/clubs/${clubId}/admin/appearance`,
      data: body,
    }),

  uploadClubLogo: (clubId: number, file: File) =>
    request<{ data: ClubIdentity }>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/identity/logo`,
      data: imageUploadData(file),
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteClubLogo: (clubId: number) =>
    request<{ data: ClubIdentity }>({
      method: 'DELETE',
      url: `/clubs/${clubId}/admin/identity/logo`,
    }),

  uploadClubHero: (clubId: number, file: File) =>
    request<{ data: ClubIdentity }>({
      method: 'POST',
      url: `/clubs/${clubId}/admin/identity/hero`,
      data: imageUploadData(file),
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteClubHero: (clubId: number) =>
    request<{ data: ClubIdentity }>({
      method: 'DELETE',
      url: `/clubs/${clubId}/admin/identity/hero`,
    }),

  listActivityLogs: (clubId: number) =>
    request<{ data: import('@/types').ActivityLogEntry[] }>({
      method: 'GET',
      url: `/clubs/${clubId}/admin/activity-logs`,
    }),
}
