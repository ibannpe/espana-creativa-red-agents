export type User = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  linkedin_url: string | null
  website_url: string | null
  skills: string[] | null
  interests: string[] | null
  completed_pct: number
  roles: Role[]
  created_at: string
  updated_at: string
}

export type Role = {
  id: number
  name: string
  description: string | null
}

export type Project = {
  id: number
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

export type Opportunity = {
  id: number
  title: string
  description: string
  skills: string[] | null
  project_id: number | null
  project?: Project | null
  status: string
  created_by: string
  creator?: User
  created_at: string
  updated_at: string
}

export type Message = {
  id: number
  sender_id: string
  receiver_id: string | null
  body: string
  is_public: boolean
  sender?: User
  receiver?: User
  created_at: string
}

export type UserRole = 'admin' | 'mentor' | 'emprendedor'