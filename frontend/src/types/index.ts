export type SellingMode = 'unit' | 'weight' | 'volume' | 'custom_text'

export interface PriceConfigUnit {
  step_value: number
  unit_label: string
  price_per_step: number
  allow_fractions?: boolean
}

export interface PriceConfigCustomText {
  flat_price: number
  unit_label: string
}

export type PriceConfig = PriceConfigUnit | PriceConfigCustomText

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  glass_opacity: number
}

export interface ThemeTypography {
  heading_font: string
  body_font: string
}

export interface ThemeConfig {
  template_id: number
  colors: ThemeColors
  typography: ThemeTypography
  assets?: {
    logo_url?: string | null
    cover_url?: string | null
  }
}

export interface EntryResponse {
  club_id: number
  nfc_uid: string
  requires_pin_setup: boolean
  club_name: string
  theme_config: ThemeConfig
}

export interface AuthUser {
  id: number
  email: string
}

export interface AuthClub {
  id: number
  name: string
  theme_config: ThemeConfig
}

export interface AuthResponse {
  token: string
  expires_in: number
  user: AuthUser
  club: AuthClub
  is_club_owner: boolean
}

export interface AuthSession extends AuthResponse {
  nfc_uid: string
}

export interface Product {
  id: number
  name: string
  selling_mode: SellingMode
  price_config: PriceConfig
  is_active: boolean
}

export interface WalletResponse {
  current_balance: string
  club_id: number
}

export interface TopupRequest {
  id: number
  amount: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string | null
}

export interface PurchaseResponse {
  transaction_id: number
  amount_deducted: string
  new_balance: string
}

export interface AiInterveneResponse {
  intervention_required: boolean
  message?: string
  persona?: string
}

export interface AiChatResponse {
  message: string
  persona?: string
}

export interface ProductPayload {
  name: string
  selling_mode: SellingMode
  price_config: PriceConfig
  is_active?: boolean
}

export interface LedgerEntry {
  id: number
  transaction_type: 'user_topup' | 'admin_injection' | 'admin_expense'
  amount: string
  description: string
  created_at: string | null
}

export interface TreasuryResponse {
  cash_flow_total: string
  ledger: LedgerEntry[]
}

export interface AdminInjectionResponse {
  user_id: number
  new_balance: string
  ledger_id: number
}

export interface Member {
  id: number
  user_id: number
  email?: string
  nfc_uid: string | null
  status: 'active' | 'suspended'
  requires_pin_setup: boolean
  wallet_balance?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
