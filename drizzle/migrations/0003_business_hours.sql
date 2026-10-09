CREATE TABLE public.business_hours (
  weekday int PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  open_time time,
  close_time time
);
GRANT SELECT ON public.business_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read hours" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage hours" ON public.business_hours FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
INSERT INTO public.business_hours VALUES
(0,NULL,NULL),(1,'13:30','20:00'),(2,'09:00','20:00'),(3,'09:00','20:00'),(4,'09:00','20:00'),(5,'09:00','20:00'),(6,'08:00','15:00');