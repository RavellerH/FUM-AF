-- Enable RLS on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;

-- transactions: owner only
CREATE POLICY "transactions_owner_only"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- summaries: owner only
CREATE POLICY "summaries_owner_only"
  ON public.summaries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- categories: owner only
CREATE POLICY "categories_owner_only"
  ON public.categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Email whitelist table
CREATE TABLE public.allowed_emails (
  email TEXT PRIMARY KEY
);

-- IMPORTANT: After running this migration, insert your email:
-- INSERT INTO public.allowed_emails(email) VALUES ('your@email.com');

-- Block transactions inserts for non-whitelisted emails
CREATE OR REPLACE FUNCTION public.check_email_whitelist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = v_email) THEN
    RAISE EXCEPTION 'Email not whitelisted: %', v_email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_transactions_whitelist
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_email_whitelist();

CREATE TRIGGER guard_summaries_whitelist
  BEFORE INSERT ON public.summaries
  FOR EACH ROW EXECUTE FUNCTION public.check_email_whitelist();
