package com.grocery.grocery_backend.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import jakarta.annotation.PostConstruct;

@Configuration
public class FlywayConfig {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void migrate() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .locations("classpath:db/migration")
                .load();
        flyway.migrate();
    }
}
