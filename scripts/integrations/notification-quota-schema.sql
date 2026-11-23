-- Manual migration only. Apply with a separately authorized database identity.
-- WARNING: creates notification quota state and a service-role-only function.
CREATE TABLE IF NOT EXISTS public.contact_notification_budget (
  recipient_hash text NOT NULL,
  budget_day date NOT NULL,
  messages_sent integer NOT NULL DEFAULT 0 CHECK (messages_sent BETWEEN 0 AND 100),
  PRIMARY KEY (recipient_hash, budget_day)
);
ALTER TABLE public.contact_notification_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_notification_budget FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.reserve_contact_notification(recipient_hash text, daily_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reserved integer;
BEGIN
  IF daily_limit < 1 OR daily_limit > 100 OR recipient_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;
  INSERT INTO public.contact_notification_budget AS budget (recipient_hash, budget_day, messages_sent)
  VALUES (recipient_hash, (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT ON CONSTRAINT contact_notification_budget_pkey
  DO UPDATE SET messages_sent = budget.messages_sent + 1
  WHERE budget.messages_sent < daily_limit
  RETURNING messages_sent INTO reserved;
  RETURN reserved IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_contact_notification(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_contact_notification(text, integer) TO service_role;
