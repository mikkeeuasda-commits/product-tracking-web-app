-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products/purchases table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  store TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  quantity_unit TEXT NOT NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read, no auth needed for this demo)
CREATE POLICY "Allow public to view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public to insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to update categories" ON public.categories USING (true);
CREATE POLICY "Allow public to delete categories" ON public.categories USING (true);

-- Create policies for products (public access for this demo)
CREATE POLICY "Allow public to view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public to insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to update products" ON public.products USING (true);
CREATE POLICY "Allow public to delete products" ON public.products USING (true);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to product images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
