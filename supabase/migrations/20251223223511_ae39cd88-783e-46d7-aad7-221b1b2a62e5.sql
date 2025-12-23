-- =============================================
-- SECURITY FIX: Update RLS policies to require authentication
-- =============================================

-- 1. Fix products table
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public insert access" ON products;
DROP POLICY IF EXISTS "Allow public update access" ON products;
DROP POLICY IF EXISTS "Allow public delete access" ON products;

CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix purchases table
DROP POLICY IF EXISTS "Allow public read access" ON purchases;
DROP POLICY IF EXISTS "Allow public insert access" ON purchases;
DROP POLICY IF EXISTS "Allow public update access" ON purchases;
DROP POLICY IF EXISTS "Allow public delete access" ON purchases;

CREATE POLICY "Authenticated users can manage purchases" ON purchases
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix sales table
DROP POLICY IF EXISTS "Allow public read access" ON sales;
DROP POLICY IF EXISTS "Allow public insert access" ON sales;
DROP POLICY IF EXISTS "Allow public update access" ON sales;
DROP POLICY IF EXISTS "Allow public delete access" ON sales;

CREATE POLICY "Authenticated users can manage sales" ON sales
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix expenses table
DROP POLICY IF EXISTS "Allow public read access" ON expenses;
DROP POLICY IF EXISTS "Allow public insert access" ON expenses;
DROP POLICY IF EXISTS "Allow public update access" ON expenses;
DROP POLICY IF EXISTS "Allow public delete access" ON expenses;

CREATE POLICY "Authenticated users can manage expenses" ON expenses
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Fix debtors table
DROP POLICY IF EXISTS "Allow public read access" ON debtors;
DROP POLICY IF EXISTS "Allow public insert access" ON debtors;
DROP POLICY IF EXISTS "Allow public update access" ON debtors;
DROP POLICY IF EXISTS "Allow public delete access" ON debtors;

CREATE POLICY "Authenticated users can manage debtors" ON debtors
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Fix creditors table
DROP POLICY IF EXISTS "Allow public read access" ON creditors;
DROP POLICY IF EXISTS "Allow public insert access" ON creditors;
DROP POLICY IF EXISTS "Allow public update access" ON creditors;
DROP POLICY IF EXISTS "Allow public delete access" ON creditors;

CREATE POLICY "Authenticated users can manage creditors" ON creditors
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Fix cash_transactions table
DROP POLICY IF EXISTS "Allow public read access" ON cash_transactions;
DROP POLICY IF EXISTS "Allow public insert access" ON cash_transactions;
DROP POLICY IF EXISTS "Allow public update access" ON cash_transactions;
DROP POLICY IF EXISTS "Allow public delete access" ON cash_transactions;

CREATE POLICY "Authenticated users can manage cash_transactions" ON cash_transactions
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Fix photo_captures table
DROP POLICY IF EXISTS "Allow public read access" ON photo_captures;
DROP POLICY IF EXISTS "Allow public insert access" ON photo_captures;
DROP POLICY IF EXISTS "Allow public update access" ON photo_captures;
DROP POLICY IF EXISTS "Allow public delete access" ON photo_captures;

CREATE POLICY "Authenticated users can manage photo_captures" ON photo_captures
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. Fix customers table
DROP POLICY IF EXISTS "Allow public read access" ON customers;
DROP POLICY IF EXISTS "Allow public insert access" ON customers;
DROP POLICY IF EXISTS "Allow public update access" ON customers;
DROP POLICY IF EXISTS "Allow public delete access" ON customers;

CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 10. Fix creditor_payments table
DROP POLICY IF EXISTS "Allow public read access" ON creditor_payments;
DROP POLICY IF EXISTS "Allow public insert access" ON creditor_payments;
DROP POLICY IF EXISTS "Allow public update access" ON creditor_payments;
DROP POLICY IF EXISTS "Allow public delete access" ON creditor_payments;

CREATE POLICY "Authenticated users can manage creditor_payments" ON creditor_payments
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- SECURITY FIX: Make photos bucket private and update storage policies
-- =============================================

-- Make photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'photos';

-- Drop existing public storage policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;

-- Create authenticated storage policies
CREATE POLICY "Authenticated users can read photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update photos" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'photos' AND auth.uid() IS NOT NULL);