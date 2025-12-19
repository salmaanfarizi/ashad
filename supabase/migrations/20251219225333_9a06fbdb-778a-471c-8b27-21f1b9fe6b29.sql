-- Create creditor_payments table for tracking payments to creditors
CREATE TABLE public.creditor_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creditor_id UUID NOT NULL REFERENCES public.creditors(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creditor_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (matching existing creditors table pattern)
CREATE POLICY "Allow public read access"
ON public.creditor_payments
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access"
ON public.creditor_payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON public.creditor_payments
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access"
ON public.creditor_payments
FOR DELETE
USING (true);