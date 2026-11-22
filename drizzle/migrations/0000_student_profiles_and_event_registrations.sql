CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL DEFAULT 'student' CHECK (char_length(username) BETWEEN 1 AND 100),
 full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 100),
 division text NOT NULL DEFAULT '' CHECK (division IN ('', 'Comp','IT','Entc','Other')),
 batch text NOT NULL DEFAULT '' CHECK (batch IN ('','2024','2025','2026','2027')),
 year text NOT NULL DEFAULT '' CHECK (year IN ('','1st Year','2nd Year','3rd Year','4th Year')),
 date_of_birth date,
 college text NOT NULL DEFAULT '' CHECK (char_length(college) <= 150),
 phone text NOT NULL DEFAULT '' CHECK (phone = '' OR phone ~ '^\+?[0-9 ()-]{7,20}$'),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_student_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles(id,username) VALUES (NEW.id, coalesce(nullif(regexp_replace(split_part(NEW.email,'@',1),'[0-9]','','g'),''),'student'));
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_student_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_student_profile_after_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();
CREATE TABLE public.event_registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 event_id text NOT NULL CHECK (event_id IN ('freshers-garba-session','open-mic-night','creative-challenge','football-tournament','tech-talk-series','dance-workshop')),
 student_details jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,event_id)
);
GRANT SELECT, INSERT ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own registrations" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own registrations" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX event_registrations_user_created ON public.event_registrations(user_id,created_at DESC);
CREATE FUNCTION public.validate_student_registration() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF jsonb_typeof(NEW.student_details) <> 'object'
 OR coalesce(length(NEW.student_details->>'full_name'),0) NOT BETWEEN 1 AND 100
 OR coalesce(NEW.student_details->>'division','') NOT IN ('Comp','IT','Entc','Other')
 OR coalesce(NEW.student_details->>'batch','') NOT IN ('2024','2025','2026','2027')
 OR coalesce(NEW.student_details->>'year','') NOT IN ('1st Year','2nd Year','3rd Year','4th Year')
 OR coalesce(length(NEW.student_details->>'college'),0) NOT BETWEEN 1 AND 150
 OR coalesce(NEW.student_details->>'phone','') !~ '^\+?[0-9 ()-]{7,20}$'
 OR coalesce(NEW.student_details->>'date_of_birth','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
 OR (NEW.student_details->>'date_of_birth')::date >= current_date
 OR coalesce((NEW.student_details->>'terms')::boolean,false) <> true
 THEN RAISE EXCEPTION 'Invalid student details'; END IF;
 IF (SELECT count(*) FROM public.event_registrations WHERE user_id = NEW.user_id AND created_at > now() - interval '1 minute') >= 12 THEN RAISE EXCEPTION 'Please wait before registering again'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_event_registration BEFORE INSERT ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.validate_student_registration();