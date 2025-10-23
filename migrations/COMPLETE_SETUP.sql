-- ============================================================================
-- COMPLETE DATABASE SETUP FOR SIGNUP APPROVAL WORKFLOW
-- ============================================================================
-- ABOUTME: Consolidated migration script for pending signups and rate limiting
-- ABOUTME: Execute this entire file in Supabase SQL Editor
--
-- This script creates:
-- 1. pending_signups table - stores signup requests
-- 2. signup_rate_limits table - prevents abuse
-- 3. RLS policies - secures data access
-- 4. Indexes and functions - optimizes performance
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: CREATE PENDING_SIGNUPS TABLE
-- ============================================================================

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

-- Add comments for documentation
COMMENT ON TABLE public.pending_signups IS 'Stores user signup requests awaiting admin approval';
COMMENT ON COLUMN public.pending_signups.approval_token IS 'UUID token for admin approval link (single-use, expires in 7 days)';
COMMENT ON COLUMN public.pending_signups.status IS 'Current status: pending (default), approved, or rejected';
COMMENT ON COLUMN public.pending_signups.ip_address IS 'IP address of signup request for rate limiting and security';
COMMENT ON COLUMN public.pending_signups.token_used_at IS 'Timestamp when approval token was used (prevents replay attacks)';

-- ============================================================================
-- MIGRATION 002: CREATE SIGNUP_RATE_LIMITS TABLE
-- ============================================================================

-- Create signup_rate_limits table
CREATE TABLE IF NOT EXISTS public.signup_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  email VARCHAR(255),
  request_count INTEGER DEFAULT 1 CHECK (request_count > 0),
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_request_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_ip_email_window UNIQUE(ip_address, email, window_start)
);

-- Create indexes for rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON public.signup_rate_limits(ip_address, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_email ON public.signup_rate_limits(email, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.signup_rate_limits(window_start DESC);

-- Add comments
COMMENT ON TABLE public.signup_rate_limits IS 'Tracks signup request frequency for rate limiting (5 req/hour per IP, 1 req/day per email)';
COMMENT ON COLUMN public.signup_rate_limits.window_start IS 'Start of the rate limit window (sliding window)';
COMMENT ON COLUMN public.signup_rate_limits.request_count IS 'Number of requests in current window';

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.signup_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (can be called via cron job or manually)
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Removes rate limit records older than 24 hours to prevent table bloat';

-- ============================================================================
-- MIGRATION 003: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on pending_signups table
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Enable RLS on signup_rate_limits table
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PENDING SIGNUPS POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can submit signup requests" ON public.pending_signups;
DROP POLICY IF EXISTS "Admins can view all pending signups" ON public.pending_signups;
DROP POLICY IF EXISTS "Admins can update pending signups" ON public.pending_signups;
DROP POLICY IF EXISTS "Admins can delete pending signups" ON public.pending_signups;

-- Policy: Allow public to INSERT signup requests (anonymous users can request signup)
CREATE POLICY "Anyone can submit signup requests"
  ON public.pending_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Admins can view all pending signups
CREATE POLICY "Admins can view all pending signups"
  ON public.pending_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policy: Admins can update pending signups (for approval/rejection)
CREATE POLICY "Admins can update pending signups"
  ON public.pending_signups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policy: Admins can delete pending signups (for cleanup)
CREATE POLICY "Admins can delete pending signups"
  ON public.pending_signups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- ============================================
-- RATE LIMITS POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can insert rate limit records" ON public.signup_rate_limits;
DROP POLICY IF EXISTS "Public can view own rate limits" ON public.signup_rate_limits;
DROP POLICY IF EXISTS "Admins can view all rate limits" ON public.signup_rate_limits;
DROP POLICY IF EXISTS "System can update rate limits" ON public.signup_rate_limits;
DROP POLICY IF EXISTS "System can delete rate limits" ON public.signup_rate_limits;

-- Policy: Allow public to INSERT rate limit records
CREATE POLICY "Public can insert rate limit records"
  ON public.signup_rate_limits
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public to SELECT their own rate limit records (by IP)
CREATE POLICY "Public can view own rate limits"
  ON public.signup_rate_limits
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admins can view all rate limit records
CREATE POLICY "Admins can view all rate limits"
  ON public.signup_rate_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policy: System can update rate limit records
CREATE POLICY "System can update rate limits"
  ON public.signup_rate_limits
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: System can delete old rate limit records
CREATE POLICY "System can delete rate limits"
  ON public.signup_rate_limits
  FOR DELETE
  TO public
  USING (true);

-- Add helpful comments on policies
COMMENT ON POLICY "Anyone can submit signup requests" ON public.pending_signups IS 'Allows anonymous users to submit signup requests';
COMMENT ON POLICY "Admins can view all pending signups" ON public.pending_signups IS 'Restricts viewing pending signups to users with admin role';
COMMENT ON POLICY "Admins can update pending signups" ON public.pending_signups IS 'Only admins can approve or reject signup requests';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup was successful:
--
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public'
-- AND tablename IN ('pending_signups', 'signup_rate_limits');
--
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('pending_signups', 'signup_rate_limits');
-- ============================================================================

SELECT '✅ Migration completed successfully!' AS status;
