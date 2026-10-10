package com.security.spring_security.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .build();
    }

    public void sendResetLink(String toEmail, String resetLink) {
        sendEmail(
                toEmail,
                "Iron Pulse — Reset Your Password",
                buildEmailBody(resetLink)
        );
    }

    public void sendVerificationEmail(
            String toEmail,
            String verificationToken) {

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
            throw new RuntimeException(
                    "RESEND_API_KEY is missing from the environment."
            );
        }

        try {
            Map<String, Object> request = Map.of(
                    "from", "Iron Pulse <onboarding@resend.dev>",
                    "to", new String[]{toEmail},
                    "subject", subject,
                    "html", html
            );

            String response = restClient.post()
                    .uri("/emails")
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            "Bearer " + resendApiKey
                    )
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(String.class);

            log.info("Resend accepted email request. Response: {}", response);

        } catch (Exception e) {
            log.error("Resend email delivery request failed: {}", e.getMessage());
            throw new RuntimeException(
                    "Unable to send email through Resend.",
                    e
            );
        }
    }

    private String buildVerificationEmailBody(String verificationLink) {
        return """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 16px; border: 1px solid rgba(16,185,129,0.2);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px;">🔥</span>
                        <h1 style="color: #10b981; font-size: 22px; margin: 12px 0 4px;">Iron Pulse</h1>
                        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Email Verification</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                            Welcome to Iron Pulse! Click below to verify your email address and activate your account:
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                                Verify Email →
                            </a>
                        </div>
                    </div>
                </div>
                """.formatted(verificationLink);
    }

    private String buildEmailBody(String resetLink) {
        return """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 16px; border: 1px solid rgba(16,185,129,0.2);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px;">🔥</span>
                        <h1 style="color: #10b981; font-size: 22px; margin: 12px 0 4px;">Iron Pulse</h1>
                        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Password Reset Request</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                            We received a request to reset your password. Click below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                                Reset Password →
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            This link expires in <strong style="color: #f59e0b;">10 minutes</strong>.<br>
                            If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>
                    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
                        <p style="color: #64748b; font-size: 12px;">
                            Iron Pulse — Your Fitness Journey Starts Here 💪
                        </p>
                    </div>
                </div>
                """.formatted(resetLink);
    }
}
