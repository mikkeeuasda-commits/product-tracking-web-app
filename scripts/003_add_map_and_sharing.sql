-- Add latitude and longitude columns for map functionality
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for faster queries on share_token
CREATE INDEX IF NOT EXISTS idx_products_share_token ON public.products(share_token);

-- Create a shared_products view for public access via share links
CREATE OR REPLACE VIEW public.shared_products AS
SELECT 
  id, name, category_id, purchase_date, store, price, unit, quantity, 
  quantity_unit, notes, image_url, latitude, longitude, share_token
FROM public.products
WHERE share_token IS NOT NULL;

-- Allow public to view shared products
CREATE POLICY "Allow public to view shared products" ON public.products 
FOR SELECT USING (share_token IS NOT NULL);
