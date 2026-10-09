import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SCHEDULE, toISODate, type ScheduleConfig, type WeekHours, type SpecialDay } from "@/lib/schedule";

export async function loadSchedule(): Promise<ScheduleConfig> {
  const [h, s] = await Promise.all([
    supabase.from("business_hours").select("weekday,open_time,close_time"),
    supabase.from("special_days").select("day,open_time,close_time,reason").gte("day", toISODate(new Date())),
  ]);
  const hours: WeekHours = { ...DEFAULT_SCHEDULE.hours };
  for (const r of h.data ?? []) {
    hours[r.weekday] = r.open_time && r.close_time ? [r.open_time.slice(0, 5), r.close_time.slice(0, 5)] : null;
  }
  const special: Record<string, SpecialDay> = {};
  for (const r of s.data ?? []) {
    special[r.day] = { open: r.open_time?.slice(0, 5) ?? null, close: r.close_time?.slice(0, 5) ?? null, reason: r.reason };
  }
  return { hours, special };
}

/** Live opening hours + holidays set by the owner; refreshes every minute. */
export function useSchedule() {
  const [cfg, setCfg] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  useEffect(() => {
    let alive = true;
    const run = () => loadSchedule().then((c) => alive && setCfg(c)).catch(() => {});
    run();
    const id = setInterval(run, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return cfg;
}
