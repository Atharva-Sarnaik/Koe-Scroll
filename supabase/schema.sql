-- User Stats Schema for KoeScroll
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading activity for heatmap
CREATE TABLE IF NOT EXISTS reading_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 1,
  pages_read INTEGER DEFAULT 0,
  minutes_listened INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 50,
  icon TEXT DEFAULT 'award'
);

-- User unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Voice stats (DNA)
CREATE TABLE IF NOT EXISTS voice_stats (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  preferred_voice_type TEXT DEFAULT 'Deep / Authoritative',
  avg_playback_speed DECIMAL DEFAULT 1.0,
  total_characters_voiced INTEGER DEFAULT 0,
  favorite_voices TEXT[] DEFAULT '{}',
  consistency_score INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read/write their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Reading activity: Users can read/write their own activity
CREATE POLICY "Users can view own activity" ON reading_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON reading_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity" ON reading_activity FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: Anyone can read, only admins can write
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- User achievements: Users can read/write their own
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Voice stats: Users can read/write their own
CREATE POLICY "Users can view own voice stats" ON voice_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own voice stats" ON voice_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice stats" ON voice_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment daily activity
CREATE OR REPLACE FUNCTION increment_daily_activity(
  p_user_id UUID,
  p_date DATE,
  p_field TEXT,
  p_increment INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reading_activity (user_id, date, sessions, pages_read, minutes_listened)
  VALUES (p_user_id, p_date, 
    CASE WHEN p_field = 'sessions' THEN p_increment ELSE 0 END,
    CASE WHEN p_field = 'pagesRead' THEN p_increment ELSE 0 END,
    CASE WHEN p_field = 'minutesListened' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    sessions = reading_activity.sessions + CASE WHEN p_field = 'sessions' THEN p_increment ELSE 0 END,
    pages_read = reading_activity.pages_read + CASE WHEN p_field = 'pagesRead' THEN p_increment ELSE 0 END,
    minutes_listened = reading_activity.minutes_listened + CASE WHEN p_field = 'minutesListened' THEN p_increment ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment voice stats
CREATE OR REPLACE FUNCTION increment_voice_stats(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO voice_stats (user_id, total_characters_voiced)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_characters_voiced = voice_stats.total_characters_voiced + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial achievements
INSERT INTO achievements (id, name, description, xp_reward, icon) VALUES
  ('first_read', 'First Steps', 'Read your first page', 50, 'award'),
  ('voice_director', 'The Director', 'Assign voices to 10 characters', 100, 'mic'),
  ('binge_listener', 'Binge Listener', 'Listen for 2 hours straight', 75, 'flame'),
  ('early_adopter', 'Early Adopter', 'Joined during Beta', 100, 'award'),
  ('week_streak', 'Dedicated Reader', 'Maintain a 7-day streak', 150, 'flame'),
  ('chapter_complete', 'Chapter Master', 'Complete 10 chapters', 100, 'award'),
  ('voice_explorer', 'Voice Explorer', 'Try 5 different voices', 50, 'mic')
ON CONFLICT (id) DO NOTHING;

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO voice_stats (user_id) VALUES (NEW.id);
  
  -- Award early adopter achievement
  INSERT INTO user_achievements (user_id, achievement_id) VALUES (NEW.id, 'early_adopter');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
