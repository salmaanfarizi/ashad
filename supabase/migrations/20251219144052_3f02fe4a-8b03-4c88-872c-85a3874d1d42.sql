-- Create inventory/products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  supplier_name TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  customer_name TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debtors table (people who owe us money)
CREATE TABLE public.debtors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  amount_owed DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creditors table (people we owe money to)
CREATE TABLE public.creditors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  amount_owed DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash transactions table
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photo captures table with location
CREATE TABLE public.photo_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  notes TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public access for now, can add auth later)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_captures ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for initial development)
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.purchases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.purchases FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.sales FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.expenses FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.debtors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.debtors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.debtors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.debtors FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.creditors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.creditors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.creditors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.creditors FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.cash_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.cash_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.cash_transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.cash_transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.photo_captures FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.photo_captures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.photo_captures FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.photo_captures FOR DELETE USING (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Allow public upload access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Allow public update access" ON storage.objects FOR UPDATE USING (bucket_id = 'photos');
CREATE POLICY "Allow public delete access" ON storage.objects FOR DELETE USING (bucket_id = 'photos');