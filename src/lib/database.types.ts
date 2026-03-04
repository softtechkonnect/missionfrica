export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountStatus = 
  | 'email_unverified'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended'

export type UserRole = 'admin' | 'missionary' | 'donor'

export type OrganizationType = 'church_extension' | 'independent'

export type PostStatus = 'pending_review' | 'approved' | 'rejected'

export type DonationStatus = 'pending' | 'completed' | 'refunded' | 'failed'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: UserRole
          account_status: AccountStatus
          public_visible: boolean
          email_verified: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: UserRole
          account_status?: AccountStatus
          public_visible?: boolean
          email_verified?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: UserRole
          account_status?: AccountStatus
          public_visible?: boolean
          email_verified?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      missionary_profiles: {
        Row: {
          id: string
          user_id: string
          organization_name: string
          organization_type: OrganizationType
          is_church_registered: boolean | null
          registration_number: string | null
          certificate_url: string | null
          mission_location: string
          role_in_org: string
          phone: string
          whatsapp: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          terms_accepted: boolean
          terms_accepted_at: string | null
          approved_at: string | null
          approved_by: string | null
          rejection_reason: string | null
          total_raised: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name: string
          organization_type: OrganizationType
          is_church_registered?: boolean | null
          registration_number?: string | null
          certificate_url?: string | null
          mission_location: string
          role_in_org: string
          phone: string
          whatsapp: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          total_raised?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string
          organization_type?: OrganizationType
          is_church_registered?: boolean | null
          registration_number?: string | null
          certificate_url?: string | null
          mission_location?: string
          role_in_org?: string
          phone?: string
          whatsapp?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          total_raised?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          missionary_id: string
          title: string
          content: string
          media_urls: string[]
          status: PostStatus
          rejection_reason: string | null
          visible: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          missionary_id: string
          title: string
          content: string
          media_urls?: string[]
          status?: PostStatus
          rejection_reason?: string | null
          visible?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          missionary_id?: string
          title?: string
          content?: string
          media_urls?: string[]
          status?: PostStatus
          rejection_reason?: string | null
          visible?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          donor_id: string | null
          missionary_id: string
          stripe_payment_intent_id: string
          amount: number
          platform_fee: number
          net_amount: number
          status: DonationStatus
          donor_name: string | null
          donor_email: string | null
          message: string | null
          is_anonymous: boolean
          available_at: string
          created_at: string
        }
        Insert: {
          id?: string
          donor_id?: string | null
          missionary_id: string
          stripe_payment_intent_id: string
          amount: number
          platform_fee: number
          net_amount: number
          status?: DonationStatus
          donor_name?: string | null
          donor_email?: string | null
          message?: string | null
          is_anonymous?: boolean
          available_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          donor_id?: string | null
          missionary_id?: string
          stripe_payment_intent_id?: string
          amount?: number
          platform_fee?: number
          net_amount?: number
          status?: DonationStatus
          donor_name?: string | null
          donor_email?: string | null
          message?: string | null
          is_anonymous?: boolean
          available_at?: string
          created_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          missionary_id: string
          amount: number
          status: WithdrawalStatus
          stripe_payout_id: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          missionary_id: string
          amount: number
          status?: WithdrawalStatus
          stripe_payout_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          missionary_id?: string
          amount?: number
          status?: WithdrawalStatus
          stripe_payout_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: UserRole
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_available_balance: {
        Args: { p_missionary_id: string }
        Returns: number
      }
      get_pending_balance: {
        Args: { p_missionary_id: string }
        Returns: number
      }
    }
    Enums: {
      account_status: AccountStatus
      user_role: UserRole
      organization_type: OrganizationType
      post_status: PostStatus
      donation_status: DonationStatus
      withdrawal_status: WithdrawalStatus
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
