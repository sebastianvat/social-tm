-- Add product_id reference to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_posts_product_id ON public.posts(product_id);
