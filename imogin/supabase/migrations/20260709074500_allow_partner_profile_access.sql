-- Allow partners to view each other's profiles
CREATE POLICY "Partners can view each other's profiles"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.partnership_members pm1
            JOIN public.partnership_members pm2 ON pm1.partnership_id = pm2.partnership_id
            WHERE pm1.user_id = auth.uid()
            AND pm2.user_id = profiles.id
        )
    );
