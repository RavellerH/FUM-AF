-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- transactions table
CREATE TABLE public.transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  amount       NUMERIC(14, 2) NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'IDR',
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category     TEXT NOT NULL DEFAULT 'Uncategorized',
  description  TEXT,
  source_file  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- summaries table
CREATE TABLE public.summaries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month          TEXT NOT NULL,
  total_income   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_expense  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  by_category    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- categories table
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Seed default categories when a user is first created
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.categories(user_id, name) VALUES
    (NEW.id, 'Food & Dining'),
    (NEW.id, 'Transport'),
    (NEW.id, 'Utilities'),
    (NEW.id, 'Housing'),
    (NEW.id, 'Healthcare'),
    (NEW.id, 'Entertainment'),
    (NEW.id, 'Shopping'),
    (NEW.id, 'Income'),
    (NEW.id, 'Uncategorized');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();
