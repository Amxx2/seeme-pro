-- SEEMEPRO Supabase Master Schema (SaaS Professional Level)
-- Run this in your Supabase SQL Editor to initialize all tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. Profiles Table (Extends auth.users)
-- =========================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  email TEXT,
  coins INTEGER DEFAULT 0,
  voice_attempts_left INTEGER DEFAULT 3,
  video_attempts_left INTEGER DEFAULT 0,
  live_interviews_left INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, referral_code)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    substring(md5(random()::text) from 1 for 6)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================
-- 2. Subscriptions Table (Stripe Integration Ready)
-- =========================================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL, -- e.g., 'free', 'jedi_master'
  status TEXT NOT NULL, -- e.g., 'active', 'canceled'
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 3. Transactions & Coins History Table
-- =========================================================
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- e.g., 'earned_coins', 'spent_coins', 'ad_reward'
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 4. Ad Rewards Tracking
-- =========================================================
CREATE TABLE public.ad_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_month TEXT NOT NULL, -- Format 'YYYY-MM'
  ads_watched INTEGER DEFAULT 0,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cycle_month)
);

-- =========================================================
-- 5. Analysis Logs (Stores Voice/Video processing outputs)
-- =========================================================
CREATE TABLE public.analysis_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'voice', 'video', 'live', 'toxic', 'hunger'
  result_status TEXT DEFAULT 'completed',
  raw_score NUMERIC,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View to summarize user usage
CREATE VIEW public.user_stats AS
SELECT 
  p.id as user_id,
  p.username,
  p.coins,
  (SELECT COUNT(*) FROM public.analysis_logs a WHERE a.user_id = p.id) as total_analyses,
  (SELECT SUM(amount) FROM public.transactions t WHERE t.user_id = p.id AND t.amount > 0) as total_coins_earned
FROM public.profiles p;
