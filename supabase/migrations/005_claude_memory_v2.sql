-- Memory system v2 (applied to production as `claude_memory_v2_hardening`).

-- 1) Lock claude_memory from the public REST API.
-- The web app never reads this table; Claude accesses it over MCP (service
-- role, bypasses RLS). RLS with no policies = deny-all for anon/authenticated.
ALTER TABLE public.claude_memory ENABLE ROW LEVEL SECURITY;

-- 2) Lifecycle status + updated_at + upsertable keys
ALTER TABLE public.claude_memory
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'resolved', 'archived')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- One row per (category, key) so facts/preferences/outstanding can be upserted
CREATE UNIQUE INDEX IF NOT EXISTS idx_claude_memory_category_key
  ON public.claude_memory(category, key) WHERE key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_claude_memory_status
  ON public.claude_memory(status);

-- Keep updated_at fresh on every update
CREATE OR REPLACE FUNCTION public.touch_claude_memory()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_claude_memory_touch ON public.claude_memory;
CREATE TRIGGER trg_claude_memory_touch
  BEFORE UPDATE ON public.claude_memory
  FOR EACH ROW EXECUTE FUNCTION public.touch_claude_memory();

-- 3) Fold stray 'finance' rows (written by a past session, invisible to the
-- documented load queries) into the canonical 'fact' category
UPDATE public.claude_memory SET category = 'fact' WHERE category = 'finance';

-- 4) Advisory fixes: pin search_path and revoke public EXECUTE on
-- SECURITY DEFINER trigger functions (trigger firing is unaffected —
-- EXECUTE is only checked at trigger creation time)
ALTER FUNCTION public.seed_default_categories() SET search_path = '';
ALTER FUNCTION public.check_email_whitelist() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.seed_default_categories() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_email_whitelist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_claude_memory() FROM PUBLIC, anon, authenticated;
