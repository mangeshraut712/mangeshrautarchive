CREATE TABLE IF NOT EXISTS samples (
  service_id TEXT NOT NULL,
  slot INTEGER NOT NULL,
  checked_at INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('healthy','degraded','unhealthy')),
  http_status INTEGER NOT NULL,
  latency_ms INTEGER,
  PRIMARY KEY(service_id, slot)
);
CREATE TABLE IF NOT EXISTS daily (
  service_id TEXT NOT NULL,
  day TEXT NOT NULL,
  healthy INTEGER NOT NULL DEFAULT 0,
  degraded INTEGER NOT NULL DEFAULT 0,
  unhealthy INTEGER NOT NULL DEFAULT 0,
  first_slot INTEGER NOT NULL,
  last_slot INTEGER NOT NULL,
  PRIMARY KEY(service_id, day)
);
CREATE TABLE IF NOT EXISTS service_state (
  service_id TEXT PRIMARY KEY,
  first_slot INTEGER NOT NULL,
  last_slot INTEGER NOT NULL,
  checked_at INTEGER NOT NULL,
  state TEXT NOT NULL,
  streak INTEGER NOT NULL,
  streak_started INTEGER NOT NULL,
  http_status INTEGER NOT NULL,
  latency_ms INTEGER
);
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  confirmed_at INTEGER NOT NULL,
  last_failure_at INTEGER NOT NULL,
  resolved_at INTEGER,
  severity TEXT NOT NULL,
  http_status INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_incident ON incidents(service_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS incident_history ON incidents(started_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS sample_retention ON samples(slot);
CREATE TRIGGER IF NOT EXISTS sample_rollup AFTER INSERT ON samples BEGIN
  INSERT INTO daily(service_id,day,healthy,degraded,unhealthy,first_slot,last_slot)
  VALUES(NEW.service_id,date(NEW.slot / 1000,'unixepoch'),NEW.state='healthy',NEW.state='degraded',NEW.state='unhealthy',NEW.slot,NEW.slot)
  ON CONFLICT(service_id,day) DO UPDATE SET
    healthy=healthy+(NEW.state='healthy'),degraded=degraded+(NEW.state='degraded'),unhealthy=unhealthy+(NEW.state='unhealthy'),
    first_slot=MIN(first_slot,NEW.slot),last_slot=MAX(last_slot,NEW.slot);
END;
CREATE TRIGGER IF NOT EXISTS sample_incident AFTER INSERT ON samples
WHEN NEW.slot > COALESCE((SELECT last_slot FROM service_state WHERE service_id=NEW.service_id),-1)
BEGIN
  INSERT INTO incidents(id,service_id,started_at,confirmed_at,last_failure_at,severity,http_status)
  SELECT NEW.service_id || ':' || streak_started, NEW.service_id, streak_started, NEW.checked_at, NEW.checked_at, NEW.state, NEW.http_status
  FROM service_state WHERE service_id=NEW.service_id AND state!='healthy' AND NEW.state!='healthy'
    AND last_slot=NEW.slot-300000
    AND NOT EXISTS(SELECT 1 FROM incidents WHERE service_id=NEW.service_id AND resolved_at IS NULL);
  UPDATE incidents SET last_failure_at=NEW.checked_at,
    severity=CASE WHEN NEW.state='unhealthy' THEN 'unhealthy' ELSE severity END,
    http_status=NEW.http_status
  WHERE service_id=NEW.service_id AND resolved_at IS NULL AND NEW.state!='healthy';
  UPDATE incidents SET resolved_at=NEW.checked_at
  WHERE service_id=NEW.service_id AND resolved_at IS NULL AND NEW.state='healthy'
    AND EXISTS(SELECT 1 FROM service_state WHERE service_id=NEW.service_id AND state='healthy' AND last_slot=NEW.slot-300000);
  INSERT INTO service_state(service_id,first_slot,last_slot,checked_at,state,streak,streak_started,http_status,latency_ms)
  VALUES(NEW.service_id,NEW.slot,NEW.slot,NEW.checked_at,NEW.state,1,NEW.checked_at,NEW.http_status,NEW.latency_ms)
  ON CONFLICT(service_id) DO UPDATE SET
    streak=CASE WHEN last_slot=NEW.slot-300000 AND (state='healthy')=(NEW.state='healthy') THEN streak+1 ELSE 1 END,
    streak_started=CASE WHEN last_slot=NEW.slot-300000 AND (state='healthy')=(NEW.state='healthy') THEN streak_started ELSE NEW.checked_at END,
    last_slot=NEW.slot,checked_at=NEW.checked_at,state=NEW.state,http_status=NEW.http_status,latency_ms=NEW.latency_ms;
END;
