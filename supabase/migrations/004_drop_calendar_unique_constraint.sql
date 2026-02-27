-- Allow multiple calendars per brand/month/year (user can add or replace)
ALTER TABLE public.content_calendars DROP CONSTRAINT IF EXISTS content_calendars_brand_id_month_year_key;
