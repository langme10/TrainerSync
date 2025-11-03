-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('trainer', 'client');

-- Create profiles table for all users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trainer profiles table
CREATE TABLE public.trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  specialties TEXT[],
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create client profiles table
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  trainer_id UUID REFERENCES public.trainer_profiles(id) ON DELETE SET NULL,
  goals TEXT,
  experience_level TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for trainer_profiles
CREATE POLICY "Trainers can view own profile"
  ON public.trainer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Trainers can update own profile"
  ON public.trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Trainers can insert own profile"
  ON public.trainer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can view their trainer profile"
  ON public.trainer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_profiles
      WHERE client_profiles.user_id = auth.uid()
      AND client_profiles.trainer_id = trainer_profiles.id
    )
  );

-- RLS Policies for client_profiles
CREATE POLICY "Clients can view own profile"
  ON public.client_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can update own profile"
  ON public.client_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can insert own profile"
  ON public.client_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can view their clients"
  ON public.client_profiles FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can update their clients"
  ON public.client_profiles FOR UPDATE
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Trainers can view own invitations"
  ON public.invitations FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invitation by code"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "Trainers can update own invitations"
  ON public.invitations FOR UPDATE
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_profiles_updated_at
  BEFORE UPDATE ON public.trainer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_client_profiles_trainer_id ON public.client_profiles(trainer_id);
CREATE INDEX idx_invitations_trainer_id ON public.invitations(trainer_id);
CREATE INDEX idx_invitations_code ON public.invitations(invite_code);
CREATE INDEX idx_invitations_email ON public.invitations(email);