-- Create debtor_payments table for tracking partial payments
CREATE TABLE public.debtor_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    debtor_id UUID NOT NULL REFERENCES public.debtors(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debtor_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage payments"
ON public.debtor_payments
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create reminder_logs table to track sent reminders
CREATE TABLE public.reminder_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    debtor_id UUID NOT NULL REFERENCES public.debtors(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL, -- 'email' or 'sms'
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
    message TEXT
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage reminder logs"
ON public.reminder_logs
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);