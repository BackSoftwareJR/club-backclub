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
  preset?: 'elegant_serif' | 'modern_sans'
  heading_font: string
  body_font: string
}

export interface ThemeInteractions {
  sounds_enabled: boolean
  haptics_enabled: boolean
}

export interface ThemeConfig {
  template_id: number
  colors: ThemeColors
  typography: ThemeTypography
  interactions?: ThemeInteractions
  assets?: {
    logo_url?: string | null
    cover_url?: string | null
  }
}

export interface EntryResponse {
  club_id: number
  nfc_uid: string
  requires_pin_setup: boolean
  requires_terms_acceptance: boolean
  terms_version: string
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
  cover_image_url: string | null
  gallery: ProductGalleryImage[]
}

export interface ProductGalleryImage {
  id: number
  image_url: string
  sort_order: number
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

export interface ClubIdentity {
  club_id: number
  logo_image_url: string | null
  hero_image_url: string | null
  theme_config: ThemeConfig
}

export interface ClubAppearancePayload {
  template_id: number
  colors: {
    primary: string
    secondary: string
    background: string
  }
  typography: {
    preset: 'elegant_serif' | 'modern_sans'
  }
  interactions: ThemeInteractions
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

export interface AnalyticsTrendPoint {
  date: string
  daily_delta: string
  cumulative_total: string
}

export interface TopConsumedProduct {
  product_id: number
  product_name: string
  purchases_count: number
  total_spent: string
}

export interface MemberViceStats {
  total_members: number
  active_spenders: number
  low_balance_members: number
  total_purchases: number
  top_spender_email: string
  top_spender_total: string
}

export interface AdminAnalyticsResponse {
  cassa_trend: AnalyticsTrendPoint[]
  top_consumed_products: TopConsumedProduct[]
  member_vice_stats: MemberViceStats
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

export interface UserClubSummary {
  id: number
  name: string
  is_owner: boolean
  is_current: boolean
  member_status: 'active' | 'suspended'
  nfc_uid: string | null
  requires_pin_setup: boolean
  theme_config: ThemeConfig
}

export interface MyClubsResponse {
  current_club_id: number
  clubs: UserClubSummary[]
}

export interface CreateClubResponse {
  club: AuthClub
  nfc_uid: string
  requires_pin_setup: boolean
  entry_path: string
}

export interface LegalTermsSection {
  heading: string
  body: string
}

export interface LegalTermsDocument {
  version: string
  effective_date: string
  title: string
  summary: string
  disclaimer: string
  sections: LegalTermsSection[]
}

export interface ActivityLogEntry {
  id: number
  event_type: string
  status: string
  nfc_uid: string | null
  user_id: number | null
  club_member_id: number | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  occurred_at: string | null
}

export interface SecurityLogEntry {
  id: number
  violation_type: string
  attempted_route: string
  ip_address: string | null
  user_agent: string | null
  nfc_uid: string | null
  metadata: Record<string, unknown> | null
  occurred_at: string | null
}

export interface SecurityRadarResponse {
  data: SecurityLogEntry[]
  has_recent_intrusions: boolean
}
