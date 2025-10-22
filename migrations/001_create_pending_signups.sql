-- ABOUTME: Migration to create pending_signups table for admin approval registration workflow
-- ABOUTME: Stores signup requests awaiting admin approval with security tokens and status tracking

-- Create pending_signups table
CREATE TABLE IF NOT EXISTS public.pending_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255),
  approval_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  token_used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT approval_consistency CHECK (
    (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
    (status = 'rejected' AND rejected_at IS NOT NULL AND rejected_by IS NOT NULL) OR
    (status = 'pending')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_status ON public.pending_signups(status);
CREATE INDEX IF NOT EXISTS idx_pending_signups_token ON public.pending_signups(approval_token);
CREATE INDEX IF NOT EXISTS idx_pending_signups_created_at ON public.pending_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_signups_status_created ON public.pending_signups(status, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.pending_signups IS 'Stores user signup requests awaiting admin approval';
COMMENT ON COLUMN public.pending_signups.approval_token IS 'UUID token for admin approval link (single-use, expires in 7 days)';
COMMENT ON COLUMN public.pending_signups.status IS 'Current status: pending (default), approved, or rejected';
COMMENT ON COLUMN public.pending_signups.ip_address IS 'IP address of signup request for rate limiting and security';
COMMENT ON COLUMN public.pending_signups.token_used_at IS 'Timestamp when approval token was used (prevents replay attacks)';
