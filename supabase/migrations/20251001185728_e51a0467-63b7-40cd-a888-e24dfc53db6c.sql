-- Function to handle profile role setup after profile creation
CREATE OR REPLACE FUNCTION public.handle_profile_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_code TEXT;
  v_trainer_id UUID;
BEGIN
  -- Get invite code from user metadata
  v_invite_code := (
    SELECT raw_user_meta_data->>'invite_code'
    FROM auth.users
    WHERE id = NEW.id
  );

  -- If user is a trainer, create trainer profile
  IF NEW.role = 'trainer' THEN
    INSERT INTO public.trainer_profiles (user_id)
    VALUES (NEW.id);
  
  -- If user is a client, create client profile
  ELSIF NEW.role = 'client' THEN
    -- If there's an invite code, find the trainer and link
    IF v_invite_code IS NOT NULL AND v_invite_code != '' THEN
      -- Get trainer_id from valid invitation
      SELECT trainer_id INTO v_trainer_id
      FROM public.invitations
      WHERE invite_code = v_invite_code
        AND status = 'pending'
        AND expires_at > now();
      
      -- Create client profile with trainer link
      INSERT INTO public.client_profiles (user_id, trainer_id)
      VALUES (NEW.id, v_trainer_id);
      
      -- Mark invitation as accepted
      IF v_trainer_id IS NOT NULL THEN
        UPDATE public.invitations
        SET status = 'accepted', accepted_at = now()
        WHERE invite_code = v_invite_code;
      END IF;
    ELSE
      -- Create client profile without trainer
      INSERT INTO public.client_profiles (user_id)
      VALUES (NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for profile creation
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_created();