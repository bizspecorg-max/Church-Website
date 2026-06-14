-- =====================================================================
-- Dinab TV — seed the VIDEO sections (run in Supabase → SQL Editor).
-- Clears the videos table and loads them grouped into sections with
-- different counts. Replace youtube_url values with the Prophet's own.
--   Watch Live (1) · Featured (1) · Recent Messages (6)
--   · Praise & Worship (2) · Crusades & Conferences (1)
-- =====================================================================

delete from public.videos;

insert into public.videos (title, section, category, youtube_url, description, play_mode, sort_order) values
  -- live player
  ('Live Service & Broadcasts', 'Watch Live', 'Live', 'https://www.youtube.com/watch?v=QM8jQHE5AAk', 'Join our services and broadcasts live from anywhere in the world.', 'inline', 0),

  -- big featured video
  ('Distance Is Not A Barrier — Just Have Faith', 'Featured', 'Prophetic Word', 'https://www.youtube.com/watch?v=rYJWRyg89wA', 'This week''s featured message — watch and be blessed.', 'inline', 0),

  -- Recent Messages (6)
  ('I Know Who I Am', 'Recent Messages', 'Identity in Christ', 'https://www.youtube.com/watch?v=frtZ4XfoXxM', 'Discover your true identity as a child of God.', 'inline', 1),
  ('Who Is On The Lord''s Side', 'Recent Messages', 'Consecration', 'https://www.youtube.com/watch?v=aULdIMQn1AQ', 'A call to full surrender to the Lordship of Jesus.', 'inline', 2),
  ('TobeChukwu — Praise God', 'Recent Messages', 'Thanksgiving', 'https://www.youtube.com/watch?v=0N8jWaBQUuA', 'Lift your voice in thanksgiving to the Almighty.', 'inline', 3),
  ('The Power of Faith', 'Recent Messages', 'Faith', 'https://www.youtube.com/watch?v=k28qCBwww0E', 'Unwavering faith unlocks the supernatural in your life.', 'inline', 4),
  ('Worship Encounter', 'Recent Messages', 'Worship', 'https://www.youtube.com/watch?v=eNKjlNyOFjY', 'Soak in His presence and be refreshed in spirit.', 'inline', 5),
  ('A Night of Praise', 'Recent Messages', 'Praise', 'https://www.youtube.com/watch?v=J4vTs2py2ro', 'Celebrate the goodness of God with thanksgiving.', 'inline', 6),

  -- Praise & Worship (2)
  ('Way Maker — Worship', 'Praise & Worship', 'Worship', 'https://www.youtube.com/watch?v=hWgJij1MSI4', 'Enter His presence with this powerful worship.', 'inline', 7),
  ('Way Maker (Live)', 'Praise & Worship', 'Live Worship', 'https://www.youtube.com/watch?v=QM8jQHE5AAk', 'A live worship experience — miracle worker.', 'inline', 8),

  -- Crusades & Conferences (1) — this one opens on YouTube
  ('Crusade Highlights', 'Crusades & Conferences', 'Crusade', 'https://www.youtube.com/watch?v=eNKjlNyOFjY', 'Highlights from our recent crusade gathering.', 'link', 9);
