package com.eshoppingzone.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Email successfully dispatched to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email dispatch failed: " + e.getMessage(), e);
        }
    }
}
