-- ABOUTME: Migration to create signup_rate_limits table for abuse prevention
-- ABOUTME: Tracks signup request frequency by IP address and email to enforce rate limits

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
