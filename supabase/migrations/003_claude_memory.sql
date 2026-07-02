CREATE TABLE public.claude_memory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT NOT NULL,
  key         TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claude_memory_category ON public.claude_memory(category);
CREATE INDEX idx_claude_memory_created ON public.claude_memory(created_at DESC);
