package com.eshoppingzone.profile.event;

import com.eshoppingzone.common.event.UserRegisteredEvent;
import com.eshoppingzone.profile.entity.UserProfile;
import com.eshoppingzone.profile.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserRegisteredConsumer {

    private static final Logger log = LoggerFactory.getLogger(UserRegisteredConsumer.class);

    private final UserProfileRepository userProfileRepository;

    public UserRegisteredConsumer(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "profile.user.registered.queue", durable = "true"),
            exchange = @Exchange(value = "${app.rabbitmq.exchange:eshoppingzone.exchange}", type = "topic"),
            key = "auth.user.registered"
    ))
    @Transactional
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for userId: {}, username: {}", event.getUserId(), event.getUsername());

        if (userProfileRepository.findByUserId(event.getUserId()).isPresent()) {
            log.info("Profile already exists for userId: {}", event.getUserId());
            return;
        }

        UserProfile profile = UserProfile.builder()
                .userId(event.getUserId())
                .username(event.getUsername())
                .email(event.getEmail())
                .build();

        userProfileRepository.save(profile);
        log.info("Auto-provisioned UserProfile for userId: {}", event.getUserId());
    }
}
