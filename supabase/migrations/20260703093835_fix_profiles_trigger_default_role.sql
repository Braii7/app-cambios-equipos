-- Actualizamos la función del trigger para que asigne rol por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'sin_rol')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
