-- 0005_subgroup_policies.sql
-- Add RLS policies granting authenticated users permission to create their own spaces

CREATE POLICY "Users can create subgroups" ON public.subgroups 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert subgroup members" ON public.subgroup_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);
