package com.eshoppingzone.wallet.event;

import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.enums.WalletStatus;
import com.eshoppingzone.common.event.UserRegisteredEvent;
import com.eshoppingzone.wallet.entity.Wallet;
import com.eshoppingzone.wallet.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class UserRegisteredConsumer {

    private static final Logger log = LoggerFactory.getLogger(UserRegisteredConsumer.class);

    private final WalletRepository walletRepository;

    public UserRegisteredConsumer(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "wallet.user.registered.queue", durable = "true"),
            exchange = @Exchange(value = "${app.rabbitmq.exchange:eshoppingzone.exchange}", type = "topic"),
            key = "auth.user.registered"
    ))
    @Transactional
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent in WalletService for userId: {}, role: {}", event.getUserId(), event.getRole());

        if (walletRepository.findByUserId(event.getUserId()).isPresent()) {
            log.info("Wallet already exists for userId: {}", event.getUserId());
            return;
        }

        Wallet wallet = Wallet.builder()
                .userId(event.getUserId())
                .role(event.getRole() != null ? event.getRole() : UserRole.CUSTOMER)
                .balance(BigDecimal.ZERO)
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        walletRepository.save(wallet);
        log.info("Auto-provisioned wallet for userId: {}, role: {}", event.getUserId(), event.getRole());
    }
}
