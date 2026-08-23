package com.security.spring_security.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendResetLink(String toEmail, String resetLink) {
        try {
            log.info("Attempting to send password reset email to: {}", toEmail);
            log.info("Reset link: {}", resetLink);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Iron Pulse — Reset Your Password");
            helper.setText(buildEmailBody(resetLink), true);

            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send reset email: " + e.getMessage(), e);
        }
    }

    public void sendVerificationEmail(String toEmail, String verificationToken) {
        try {
            String verificationLink = "http://localhost:5173/verify-email?token=" + verificationToken;
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Iron Pulse — Verify Your Email");
            helper.setText(buildVerificationEmailBody(verificationLink), true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send verification email: " + e.getMessage(), e);
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
                            Welcome to Iron Pulse! Click the button below to verify your email address and activate your account:
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
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
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 16px; border: 1px solid rgba(16,185,129,0.2);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 40px;">🔥</span>
                        <h1 style="color: #10b981; font-size: 22px; margin: 12px 0 4px;">Iron Pulse</h1>
                        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Password Reset Request</p>
                    </div>

                    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s"
                               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
                                Reset Password →
                            </a>
                        </div>

                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                            ⏱ This link expires in <strong style="color: #f59e0b;">10 minutes</strong>.<br>
                            If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>

                    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                            Iron Pulse — Your Fitness Journey Starts Here 💪
                        </p>
                    </div>
                </div>
                """
                .formatted(resetLink);
    }
}
