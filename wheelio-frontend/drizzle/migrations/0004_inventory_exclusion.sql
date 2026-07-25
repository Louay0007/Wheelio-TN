-- Stage 2 inventory exclusion: physical vehicle ranges cannot overlap while held/confirmed/active.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE inventory_holds
  ADD COLUMN IF NOT EXISTS reserved_range tstzrange
  GENERATED ALWAYS AS (tstzrange(reserved_start, reserved_end, '[)')) STORED;

ALTER TABLE inventory_allocations
  ADD COLUMN IF NOT EXISTS reserved_range tstzrange
  GENERATED ALWAYS AS (tstzrange(reserved_start, reserved_end, '[)')) STORED;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_vehicle_holds'
  ) THEN
    ALTER TABLE inventory_holds
      ADD CONSTRAINT no_overlapping_vehicle_holds
      EXCLUDE USING gist (
        vehicle_id WITH =,
        reserved_range WITH &&
      )
      WHERE (vehicle_id IS NOT NULL AND status = 'held' AND expires_at > now());
  END IF;
EXCEPTION
  WHEN others THEN
    -- Partial exclusion with now() is not IMMUTABLE in some PG versions; fall back without expires predicate.
    BEGIN
      ALTER TABLE inventory_holds
        ADD CONSTRAINT no_overlapping_vehicle_holds
        EXCLUDE USING gist (
          vehicle_id WITH =,
          reserved_range WITH &&
        )
        WHERE (vehicle_id IS NOT NULL AND status = 'held');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_vehicle_allocations'
  ) THEN
    ALTER TABLE inventory_allocations
      ADD CONSTRAINT no_overlapping_vehicle_allocations
      EXCLUDE USING gist (
        vehicle_id WITH =,
        reserved_range WITH &&
      )
      WHERE (vehicle_id IS NOT NULL AND status IN ('held','confirmed','active'));
  END IF;
END $$;
