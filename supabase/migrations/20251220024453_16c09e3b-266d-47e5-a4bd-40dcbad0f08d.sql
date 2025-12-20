-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access
CREATE POLICY "Allow public read access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.customers FOR DELETE USING (true);

-- Create trigger for updated_at on customers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment_status and customer_id to sales table for credit tracking
ALTER TABLE public.sales ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE public.sales ADD COLUMN customer_id UUID REFERENCES public.customers(id);