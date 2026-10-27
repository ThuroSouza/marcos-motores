-- Marcos Motores: estrutura inicial. Sem estoque fictício.
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
  slug varchar(140) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE motorcycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand varchar(100) NOT NULL CHECK (length(trim(brand)) > 0),
  model varchar(120) NOT NULL CHECK (length(trim(model)) > 0),
  version varchar(120),
  slug varchar(240) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  manufacture_year smallint NOT NULL CHECK (manufacture_year BETWEEN 1950 AND 2100),
  model_year smallint NOT NULL CHECK (model_year BETWEEN 1950 AND 2102),
  mileage_km integer NOT NULL CHECK (mileage_km >= 0),
  engine_capacity_cc integer NOT NULL CHECK (engine_capacity_cc > 0),
  color varchar(80) NOT NULL CHECK (length(trim(color)) > 0),
  fuel_type varchar(80),
  price_cents bigint NOT NULL CHECK (price_cents BETWEEN 0 AND 9007199254740991),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  observations text,
  status varchar(16) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX motorcycles_public_recent_idx ON motorcycles (created_at DESC) WHERE is_published = true;
CREATE INDEX motorcycles_public_price_idx ON motorcycles (price_cents) WHERE is_published = true;
CREATE INDEX motorcycles_category_status_idx ON motorcycles (category_id, status);
CREATE INDEX motorcycles_model_year_idx ON motorcycles (model_year);
CREATE INDEX motorcycles_brand_idx ON motorcycles (brand);
CREATE INDEX motorcycles_featured_idx ON motorcycles (created_at DESC) WHERE is_published = true AND is_featured = true;

CREATE TABLE motorcycle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
  storage_key text NOT NULL UNIQUE CHECK (length(storage_key) > 0),
  alt_text varchar(240),
  mime_type varchar(40) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  is_cover boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX motorcycle_images_order_idx ON motorcycle_images (motorcycle_id, display_order, created_at);
CREATE UNIQUE INDEX motorcycle_images_one_cover_idx ON motorcycle_images (motorcycle_id) WHERE is_cover = true;

CREATE TABLE motorcycle_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
  label varchar(160) NOT NULL CHECK (length(trim(label)) > 0),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE INDEX motorcycle_features_order_idx ON motorcycle_features (motorcycle_id, display_order);

CREATE TABLE store_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name varchar(160) NOT NULL CHECK (length(trim(store_name)) > 0),
  whatsapp_number varchar(20) CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^[1-9][0-9]{6,19}$'),
  phone varchar(40),
  address text,
  business_hours text,
  instagram_url text,
  facebook_url text,
  description text,
  about_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Apenas o nome oficial informado no escopo. Nenhum telefone, endereço ou estoque é criado.
INSERT INTO store_settings (id, store_name) VALUES (1, 'Marcos Motores');

CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL CHECK (email = lower(email)),
  password_hash text NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admin_users_email_idx ON admin_users (email);

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);

CREATE INDEX admin_sessions_user_active_idx ON admin_sessions (admin_user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE admin_login_attempts (
  attempt_key char(64) PRIMARY KEY CHECK (attempt_key ~ '^[0-9a-f]{64}$'),
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER motorcycles_updated_at BEFORE UPDATE ON motorcycles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER admin_login_attempts_updated_at BEFORE UPDATE ON admin_login_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
