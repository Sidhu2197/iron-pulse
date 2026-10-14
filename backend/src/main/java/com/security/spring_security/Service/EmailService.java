package com.security.spring_security.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import jakarta.mail.internet.MimeMessage;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
public class EmailService {

        private static final Logger log = LoggerFactory.getLogger(EmailService.class);

        private final RestClient gmailClient;
        private final RestClient oauthClient;

        @Autowired(required = false)
        private JavaMailSender mailSender;

        @Value("${spring.mail.username:}")
        private String mailUsername;

        @Value("${GMAIL_CLIENT_ID:}")
        private String clientId;

        @Value("${GMAIL_CLIENT_SECRET:}")
        private String clientSecret;

        @Value("${GMAIL_REFRESH_TOKEN:}")
        private String refreshToken;

        @Value("${GMAIL_SENDER:}")
        private String senderEmail;

        @Value("${app.frontend.url}")
        private String frontendUrl;

        public EmailService() {
                this.gmailClient = RestClient.builder()
                                .baseUrl("https://gmail.googleapis.com/gmail/v1")
                                .build();

                this.oauthClient = RestClient.builder()
                                .baseUrl("https://oauth2.googleapis.com")
                                .build();
        }

        public void sendResetLink(String toEmail, String resetLink) {
                sendEmail(
                                toEmail,
                                "Iron Pulse — Reset Your Password",
                                buildEmailBody(resetLink));
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
                                buildVerificationEmailBody(verificationLink));
        }

        private void sendEmail(
                        String toEmail,
                        String subject,
                        String html) {

                if (!clientId.isBlank()
                                && !clientSecret.isBlank()
                                && !refreshToken.isBlank()
                                && !senderEmail.isBlank()) {
                        sendViaGmailApi(toEmail, subject, html);
                        return;
                }

                if (mailSender != null && !mailUsername.isBlank()) {
                        sendViaSmtp(toEmail, subject, html);
                        return;
                }

                throw new IllegalStateException(
                                "Email configuration missing: neither Gmail API nor Spring Mail credentials configured.");
        }

        private void sendViaSmtp(
                        String toEmail,
                        String subject,
                        String html) {
                try {
                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                        String from = !senderEmail.isBlank() ? senderEmail : mailUsername;
                        helper.setFrom("Iron Pulse <" + from + ">");
                        helper.setTo(toEmail);
                        helper.setSubject(subject);
                        helper.setText(html, true);

                        mailSender.send(message);
                        log.info("SMTP: Email sent successfully to {}", toEmail);

                } catch (Exception e) {
                        log.error("SMTP: Failed to send email to {}: {}", toEmail, e.getMessage(), e);
                        throw new RuntimeException("Unable to send email via SMTP: " + e.getMessage(), e);
                }
        }

        private void sendViaGmailApi(
                        String toEmail,
                        String subject,
                        String html) {

                try {
                        String accessToken = getAccessToken();

                        String rawMessage = buildRawMessage(
                                        toEmail, subject, html);

                        String encodedMessage = Base64.getUrlEncoder()
                                        .withoutPadding()
                                        .encodeToString(
                                                        rawMessage.getBytes(StandardCharsets.UTF_8));

                        Map<String, Object> request = Map.of(
                                        "raw", encodedMessage);

                        gmailClient.post()
                                        .uri("/users/me/messages/send")
                                        .headers(headers -> headers.setBearerAuth(accessToken))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .body(request)
                                        .retrieve()
                                        .body(String.class);

                        log.info("GMAIL API: Email accepted for recipient {}",
                                        toEmail);

                } catch (Exception e) {
                        log.error("GMAIL API: Failed to send email: {}",
                                        e.getMessage(), e);

                        throw new RuntimeException(
                                        "Unable to send email through Gmail API.", e);
                }
        }

        private String getAccessToken() {
                LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();

                form.add("client_id", clientId);
                form.add("client_secret", clientSecret);
                form.add("refresh_token", refreshToken);
                form.add("grant_type", "refresh_token");

                Map<?, ?> response = oauthClient.post()
                                .uri("/token")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                .body(form)
                                .retrieve()
                                .body(Map.class);

                if (response == null || response.get("access_token") == null) {
                        throw new RuntimeException(
                                        "Google OAuth did not return an access token.");
                }

                return response.get("access_token").toString();
        }

        private String buildRawMessage(
                        String toEmail,
                        String subject,
                        String html) {

                String encodedSubject = "=?UTF-8?B?"
                                + Base64.getEncoder().encodeToString(
                                                subject.getBytes(StandardCharsets.UTF_8))
                                + "?=";

                return "From: Iron Pulse <" + senderEmail + ">\r\n"
                                + "To: " + toEmail + "\r\n"
                                + "Subject: " + encodedSubject + "\r\n"
                                + "MIME-Version: 1.0\r\n"
                                + "Content-Type: text/html; charset=UTF-8\r\n"
                                + "Content-Transfer-Encoding: base64\r\n"
                                + "\r\n"
                                + Base64.getEncoder().encodeToString(
                                                html.getBytes(StandardCharsets.UTF_8));
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
                                """
                                .formatted(verificationLink);
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
                                """
                                .formatted(resetLink);
        }
}
