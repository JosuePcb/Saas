package com.saas;

import org.springframework.boot.SpringApplication;

public class TestSaasApplication {

	public static void main(String[] args) {
		SpringApplication.from(SaasApplication::main)
				.with(TestcontainersConfiguration.class)
				.run(args);
	}
}
