package com.appointments.booking.appointments.service.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Sends the pre-registration phone OTP used to confirm phone ownership
 * during step 1 of partner signup (see PhoneOtpService) — the SMS
 * equivalent of {@code MailService.sendOtpEmail}.
 * <p>
 * No SMS provider (Twilio, AWS SNS, MessageBird, etc.) is wired up yet —
 * there's no such dependency in pom.xml. If {@code app.sms.provider} is
 * left unset (the default), this falls back to logging the code instead of
 * attempting to send, exactly like MailService does when SMTP credentials
 * aren't configured — so phone verification still works end-to-end in
 * local dev/testing without a real SMS account.
 * <p>
 * To send real texts: add the chosen provider's SDK dependency, replace the
 * body of {@link #sendOtpSms} with a real API call, and set
 * {@code SMS_PROVIDER} (plus that provider's own credentials) in the
 * environment.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${app.sms.provider:}")
    private String smsProvider;

    public boolean isSendingEnabled() {
        return smsProvider != null && !smsProvider.isBlank();
    }

    public void sendOtpSms(String phoneNumber, String code) {
        if (!isSendingEnabled()) {
            // Dev-friendly fallback: no SMS provider configured, just log the
            // code so it can be read off the server console during local
            // testing (same pattern as MailService's SMTP fallback).
            log.info("[SmsService] No SMS provider configured — OTP code for {}: {}", phoneNumber, code);
            return;
        }

        // TODO: wire up the real provider's SDK here once SMS_PROVIDER is
        // set (e.g. Twilio's Message.creator(...).create()). Left
        // unimplemented since no provider/credentials are configured yet.
        log.warn("[SmsService] app.sms.provider is set to '{}' but no real integration exists yet — "
                + "falling back to logging the code for {}: {}", smsProvider, phoneNumber, code);
    }
}
