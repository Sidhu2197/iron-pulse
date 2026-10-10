package com.security.spring_security.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private final RestClient restClient;

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .build();
    }

    public void sendResetLink(String toEmail, String resetLink) {
        log.info("RESEND DEBUG: sendResetLink() was called");

        String html = buildEmailBody(resetLink);

        sendEmail(
                toEmail,
                "Iron Pulse — Reset Your Password",
                html
        );
    }

    public void sendVerificationEmail(
            String toEmail,
            String verificationToken) {

        log.info("RESEND DEBUG: sendVerificationEmail() was called");

        String verificationLink = frontendUrl
                + "/verify-email?token="
                + verificationToken;

        sendEmail(
                toEmail,
                "Iron Pulse — Verify Your Email",
                buildVerificationEmailBody(verificationLink)
        );
    }

    private void sendEmail(
            String toEmail,
            String subject,
            String html) {

        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("RESEND ERROR: RESEND_API_KEY is missing");
            throw new RuntimeException("Email service is not configured.");
        }

        try {
            log.info("RESEND DEBUG: Sending email through Resend API");

            Map<String, Object> request = Map.of(
                    "from", "Iron Pulse <onboarding@resend.dev>",
                    "to", new String[]{toEmail},
                    "subject", subject,
                    "html", html
            );

            String response = restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(String.class);

            log.info("RESEND SUCCESS: API accepted email request. Response: {}",
                    response);

        } catch (Exception e) {
            log.error("RESEND ERROR: Email request failed: {}",
                    e.getMessage(), e);

            throw new RuntimeException(
                    "Unable to send email through Resend.",
                    e
            );
        }
    }

    private String buildVerificationEmailBody(String verificationLink) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px;">🔥</span>
                        <h1 style="color: #10b981;">Iron Pulse</h1>
                        <p style="color: #94a3b8;">Email Verification</p>
                    </div>
                    <div style="padding: 24px;">
                        <p style="color: #e2e8f0; line-height: 1.6;">
                            Welcome to Iron Pulse! Click below to verify your email address and activate your account.
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600;">
                                Verify Email →
                            </a>
                        </div>
                    </div>
                </div>
                """.formatted(verificationLink);
    }

    private String buildEmailBody(String resetLink) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px;">🔥</span>
                        <h1 style="color: #10b981;">Iron Pulse</h1>
                        <p style="color: #94a3b8;">Password Reset Request</p>
                    </div>
                    <div style="padding: 24px;">
                        <p style="color: #e2e8f0; line-height: 1.6;">
                            We received a request to reset your password. Click below to create a new password.
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600;">
                                Reset Password →
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">
                            This link expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>
                </div>
                """.formatted(resetLink);
    }
}
