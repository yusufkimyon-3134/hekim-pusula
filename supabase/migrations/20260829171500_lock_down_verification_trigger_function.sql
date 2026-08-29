-- Trigger fonksiyonu Data API üzerinden doğrudan çağrılamamalıdır.
-- Trigger çalışması EXECUTE ayrıcalığı gerektirmediği için bu revokelar
-- karar akışını etkilemez.
revoke all on function public.apply_doctor_verification_decision() from public;
revoke all on function public.apply_doctor_verification_decision() from anon, authenticated;
