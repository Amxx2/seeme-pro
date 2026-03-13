-- Friend Clans (private groups)
CREATE TABLE clans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  avatar_emoji TEXT DEFAULT '🏆',
  is_private BOOLEAN DEFAULT true,
  max_members INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clan Members
CREATE TABLE clan_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT,
  rank_title TEXT DEFAULT 'عضو',
  coins_contributed INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- Clan Chat Messages
CREATE TABLE clan_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT,
  message TEXT,
  message_type TEXT DEFAULT 'text', -- text | gift | system
  gift_data JSONB, -- { giftId, giftName, giftEmoji, abcoins_value, animation }
  rank_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Store Items
CREATE TABLE gift_store (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  emoji TEXT NOT NULL,
  animation TEXT, -- css animation class
  abcoins_cost INT NOT NULL,
  coins_given_to_receiver INT NOT NULL,
  rarity TEXT DEFAULT 'common', -- common | rare | epic | legendary
  color TEXT DEFAULT '#FFD60A'
);

-- Gift Transactions
CREATE TABLE gift_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  clan_id UUID REFERENCES clans(id),
  gift_id TEXT REFERENCES gift_store(id),
  abcoins_spent INT,
  coins_received INT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Ticker Events
CREATE TABLE ticker_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT, -- gift | rank_up | new_user | clan_created | milestone
  display_text TEXT,
  emoji TEXT,
  color TEXT DEFAULT '#00FFD4',
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE clan_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ticker_events;
ALTER PUBLICATION supabase_realtime ADD TABLE gift_transactions;

-- Seed gift store
INSERT INTO gift_store VALUES
('rose', 'Rose', 'وردة', '🌹', 'bounce', 5, 10, 'common', '#FF3B30'),
('star', 'Star', 'نجمة', '⭐', 'spin', 10, 20, 'common', '#FFD60A'),
('crown', 'Crown', 'تاج', '👑', 'pulse', 30, 60, 'rare', '#FFD60A'),
('diamond', 'Diamond', 'ماسة', '💎', 'sparkle', 50, 100, 'rare', '#00FFD4'),
('rocket', 'Rocket', 'صاروخ', '🚀', 'fly', 100, 200, 'epic', '#147EFF'),
('trophy', 'Trophy', 'كأس', '🏆', 'glow', 200, 400, 'epic', '#FF9F0A'),
('galaxy', 'Galaxy', 'مجرة', '🌌', 'explode', 500, 1000, 'legendary', '#9B59B6'),
('god_mode', 'God Mode', 'وضع الإله', '⚡', 'thunder', 1000, 2000, 'legendary', '#FF453A');
