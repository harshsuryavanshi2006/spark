CREATE TABLE public.clubs (
  id text PRIMARY KEY,
  name text NOT NULL,
  member_count integer NOT NULL DEFAULT 0 CHECK (member_count >= 0)
);
GRANT SELECT ON public.clubs TO anon, authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.club_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_memberships_user_club_unique UNIQUE (user_id, club_id)
);
GRANT SELECT, INSERT ON public.club_memberships TO authenticated;
GRANT ALL ON public.club_memberships TO service_role;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own club memberships" ON public.club_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can join clubs as themselves" ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.club_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  club_name text NOT NULL CHECK (char_length(btrim(club_name)) BETWEEN 1 AND 100),
  category text NOT NULL CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Workshop', 'Social', 'Other')),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.club_suggestions TO authenticated;
GRANT ALL ON public.club_suggestions TO service_role;
ALTER TABLE public.club_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own club suggestions" ON public.club_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can submit club suggestions as themselves" ON public.club_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE FUNCTION public.increment_club_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clubs
  SET member_count = member_count + 1
  WHERE id = NEW.club_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Club not found';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER increment_club_member_count_after_join
AFTER INSERT ON public.club_memberships
FOR EACH ROW EXECUTE FUNCTION public.increment_club_member_count();