package com.eshoppingzone.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:eshoppingzone.notifications@gmail.com}")
    private String fromEmail;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void sendEmail(String to, String subject, String content) {
        log.info("Preparing to send email to: [{}], Subject: [{}]", to, subject);

        if (!mailEnabled) {
            log.info("\n================ [EMAIL SIMULATION] ================\nTo: {}\nSubject: {}\nContent:\n{}\n====================================================",
                    to, subject, content);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "EShopping Zone");
            helper.setTo(to);
            helper.setSubject(subject);

            boolean isHtml = content != null && (content.contains("<html") || content.contains("<div") || content.contains("<table"));
            helper.setText(content, isHtml);

            mailSender.send(message);
            log.info("Email successfully dispatched to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email dispatch failed: " + e.getMessage(), e);
        }
    }
}
