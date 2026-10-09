CREATE TABLE public.special_days (
  day date PRIMARY KEY,
  open_time time,
  close_time time,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.special_days TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.special_days TO authenticated;
GRANT ALL ON public.special_days TO service_role;
ALTER TABLE public.special_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read special days" ON public.special_days FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage special days" ON public.special_days FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.validate_appointment_hours()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o time; c time; found_special boolean;
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  SELECT true, open_time, close_time INTO found_special, o, c FROM public.special_days WHERE day = NEW.appt_date;
  IF NOT coalesce(found_special,false) THEN
    SELECT open_time, close_time INTO o, c FROM public.business_hours WHERE weekday = extract(dow FROM NEW.appt_date)::int;
  END IF;
  IF o IS NULL OR c IS NULL OR NEW.appt_time < o OR NEW.appt_time >= c THEN
    RAISE EXCEPTION 'Fora do horário de atendimento' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER appointments_validate_hours BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_hours();