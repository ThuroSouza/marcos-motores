-- Operações atômicas de anúncios e imagens; objetos R2 pendentes de remoção.
ALTER TABLE motorcycle_images ADD COLUMN byte_size integer CHECK (byte_size > 0 AND byte_size <= 8388608);

CREATE TABLE r2_delete_jobs (
  storage_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION save_motorcycle(
  p_id uuid, p_brand text, p_model text, p_version text, p_slug text,
  p_category_id uuid, p_manufacture_year smallint, p_model_year smallint,
  p_mileage_km integer, p_engine_capacity_cc integer, p_color text,
  p_fuel_type text, p_price_cents bigint, p_description text,
  p_observations text, p_status text, p_is_published boolean,
  p_is_featured boolean, p_features jsonb
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE id = p_category_id AND is_active = true) THEN
    RAISE EXCEPTION 'active category required' USING ERRCODE = 'P0001';
  END IF;
  IF p_is_published AND (p_id IS NULL OR NOT EXISTS (SELECT 1 FROM motorcycle_images WHERE motorcycle_id = p_id)) THEN
    RAISE EXCEPTION 'image required to publish' USING ERRCODE = 'P0001';
  END IF;
  IF p_features IS NULL OR jsonb_typeof(p_features) <> 'array' OR jsonb_array_length(p_features) > 20 THEN
    RAISE EXCEPTION 'invalid features' USING ERRCODE = 'P0001';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO motorcycles (brand, model, version, slug, category_id, manufacture_year,
      model_year, mileage_km, engine_capacity_cc, color, fuel_type, price_cents,
      description, observations, status, is_published, is_featured)
    VALUES (p_brand, p_model, p_version, p_slug, p_category_id, p_manufacture_year,
      p_model_year, p_mileage_km, p_engine_capacity_cc, p_color, p_fuel_type,
      p_price_cents, p_description, p_observations, p_status, p_is_published, p_is_featured)
    RETURNING id INTO v_id;
  ELSE
    UPDATE motorcycles SET brand = p_brand, model = p_model, version = p_version,
      slug = p_slug, category_id = p_category_id, manufacture_year = p_manufacture_year,
      model_year = p_model_year, mileage_km = p_mileage_km,
      engine_capacity_cc = p_engine_capacity_cc, color = p_color, fuel_type = p_fuel_type,
      price_cents = p_price_cents, description = p_description,
      observations = p_observations, status = p_status,
      is_published = p_is_published, is_featured = p_is_featured
    WHERE id = p_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'motorcycle not found' USING ERRCODE = 'P0002'; END IF;
    DELETE FROM motorcycle_features WHERE motorcycle_id = v_id;
  END IF;

  INSERT INTO motorcycle_features (motorcycle_id, label, display_order)
  SELECT v_id, value, ordinality::integer - 1
  FROM jsonb_array_elements_text(p_features) WITH ORDINALITY AS feature(value, ordinality);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION attach_motorcycle_image(
  p_motorcycle_id uuid, p_storage_key text, p_alt_text text,
  p_mime_type text, p_byte_size integer
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_count integer; v_id uuid;
BEGIN
  PERFORM 1 FROM motorcycles WHERE id = p_motorcycle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'motorcycle not found' USING ERRCODE = 'P0002'; END IF;
  SELECT count(*)::integer INTO v_count FROM motorcycle_images WHERE motorcycle_id = p_motorcycle_id;
  IF v_count >= 12 THEN RAISE EXCEPTION 'image limit reached' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO motorcycle_images (motorcycle_id, storage_key, alt_text, mime_type,
    byte_size, is_cover, display_order)
  VALUES (p_motorcycle_id, p_storage_key, p_alt_text, p_mime_type, p_byte_size,
    v_count = 0, v_count) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION set_motorcycle_cover(p_motorcycle_id uuid, p_image_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM motorcycles WHERE id = p_motorcycle_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM motorcycle_images WHERE id = p_image_id AND motorcycle_id = p_motorcycle_id) THEN
    RAISE EXCEPTION 'image not found' USING ERRCODE = 'P0002';
  END IF;
  UPDATE motorcycle_images SET is_cover = false WHERE motorcycle_id = p_motorcycle_id AND is_cover = true;
  UPDATE motorcycle_images SET is_cover = true WHERE id = p_image_id;
END;
$$;

CREATE OR REPLACE FUNCTION move_motorcycle_image(p_motorcycle_id uuid, p_image_id uuid, p_direction integer)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_position integer; v_neighbour_id uuid; v_neighbour_position integer;
BEGIN
  IF p_direction NOT IN (-1, 1) THEN RAISE EXCEPTION 'invalid direction' USING ERRCODE = 'P0001'; END IF;
  PERFORM 1 FROM motorcycles WHERE id = p_motorcycle_id FOR UPDATE;
  WITH ranked AS (
    SELECT id, row_number() OVER (ORDER BY display_order, created_at, id)::integer - 1 AS position
    FROM motorcycle_images WHERE motorcycle_id = p_motorcycle_id
  ) UPDATE motorcycle_images i SET display_order = ranked.position
    FROM ranked WHERE i.id = ranked.id;
  SELECT display_order INTO v_position FROM motorcycle_images
    WHERE id = p_image_id AND motorcycle_id = p_motorcycle_id;
  IF v_position IS NULL THEN RAISE EXCEPTION 'image not found' USING ERRCODE = 'P0002'; END IF;
  SELECT id, display_order INTO v_neighbour_id, v_neighbour_position
    FROM motorcycle_images WHERE motorcycle_id = p_motorcycle_id
    AND display_order = v_position + p_direction LIMIT 1;
  IF v_neighbour_id IS NOT NULL THEN
    UPDATE motorcycle_images SET display_order = CASE
      WHEN id = p_image_id THEN v_neighbour_position ELSE v_position END
      WHERE id IN (p_image_id, v_neighbour_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION remove_motorcycle_image(p_motorcycle_id uuid, p_image_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_key text; v_was_cover boolean;
BEGIN
  PERFORM 1 FROM motorcycles WHERE id = p_motorcycle_id FOR UPDATE;
  SELECT storage_key, is_cover INTO v_key, v_was_cover FROM motorcycle_images
    WHERE id = p_image_id AND motorcycle_id = p_motorcycle_id;
  IF v_key IS NULL THEN RAISE EXCEPTION 'image not found' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO r2_delete_jobs (storage_key) VALUES (v_key) ON CONFLICT DO NOTHING;
  DELETE FROM motorcycle_images WHERE id = p_image_id;
  IF v_was_cover THEN
    UPDATE motorcycle_images SET is_cover = true WHERE id = (
      SELECT id FROM motorcycle_images WHERE motorcycle_id = p_motorcycle_id
      ORDER BY display_order, created_at, id LIMIT 1
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM motorcycle_images WHERE motorcycle_id = p_motorcycle_id) THEN
    UPDATE motorcycles SET is_published = false WHERE id = p_motorcycle_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delete_motorcycle(p_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM motorcycles WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'motorcycle not found' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO r2_delete_jobs (storage_key)
    SELECT storage_key FROM motorcycle_images WHERE motorcycle_id = p_id
    ON CONFLICT DO NOTHING;
  DELETE FROM motorcycle_features WHERE motorcycle_id = p_id;
  DELETE FROM motorcycle_images WHERE motorcycle_id = p_id;
  DELETE FROM motorcycles WHERE id = p_id;
END;
$$;
