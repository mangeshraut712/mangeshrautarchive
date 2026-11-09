-- Preserve the worst observed state when consecutive failures differ.
DROP TRIGGER IF EXISTS sample_incident;
CREATE TRIGGER IF NOT EXISTS sample_incident AFTER INSERT ON samples
WHEN NEW.slot > COALESCE((SELECT last_slot FROM service_state WHERE service_id=NEW.service_id),-1)
BEGIN
  INSERT INTO incidents(id,service_id,started_at,confirmed_at,last_failure_at,severity,http_status)
  SELECT NEW.service_id || ':' || streak_started, NEW.service_id, streak_started, NEW.checked_at, NEW.checked_at, CASE WHEN state='unhealthy' OR NEW.state='unhealthy' THEN 'unhealthy' ELSE 'degraded' END, NEW.http_status
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
