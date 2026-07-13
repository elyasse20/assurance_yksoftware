package com.yksoftware.assurance.config;

import com.yksoftware.assurance.model.User;
import com.yksoftware.assurance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer — runs on startup, creates the default admin user if none exists.
 * Equivalent of seedAdmin.js in the Node.js backend.
 *
 * Configure the admin credentials via environment variables:
 *   ADMIN_EMAIL    (default: admin@yksoftware.com)
 *   ADMIN_PASSWORD (default: admin123)
 *   ADMIN_USERNAME (default: admin)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@yksoftware.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("✓ Admin user already exists: {}", adminEmail);
            return;
        }

        User admin = User.builder()
                .username(adminUsername)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(User.UserRole.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("✓ Admin user created: {} (role: ADMIN)", adminEmail);
        log.warn("⚠ Change the default admin password in production!");
    }
}
