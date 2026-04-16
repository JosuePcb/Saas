package com.saas.core.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("AI provider configuration policy tests")
class AiProviderConfigurationPolicyTest {

    @Test
    @DisplayName("main runtime properties should enforce Gemini-only provider")
    void mainRuntimePropertiesShouldEnforceGeminiOnlyProvider() throws IOException {
        Properties properties = loadProperties(Path.of("src/main/resources/application.properties"));

        assertThat(properties.getProperty("spring.ai.model.chat")).isEqualTo("google-genai");
        assertThat(properties.getProperty("spring.ai.google.genai.api-key")).isNotBlank();
        assertThat(properties.getProperty("spring.autoconfigure.exclude"))
                .contains("org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration");
        assertThat(properties.stringPropertyNames())
                .noneMatch(name -> name.startsWith("spring.ai.openai."));
    }

    @Test
    @DisplayName("test profile should keep Gemini path and explicitly exclude OpenAI autoconfiguration")
    void testProfileShouldKeepGeminiPathAndExplicitlyExcludeOpenAi() throws IOException {
        Properties properties = loadProperties(Path.of("src/test/resources/application-test.properties"));

        assertThat(properties.getProperty("spring.ai.model.chat")).isEqualTo("google-genai");
        assertThat(properties.getProperty("spring.ai.google.genai.api-key")).isEqualTo("test-key");
        assertThat(properties.getProperty("spring.autoconfigure.exclude"))
                .contains("org.springframework.ai.autoconfigure.google.genai.GoogleGenAiAutoConfiguration")
                .contains("org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration");
        assertThat(properties.stringPropertyNames())
                .noneMatch(name -> name.startsWith("spring.ai.openai."));
    }

    @Test
    @DisplayName("classpath should not provide OpenAI runtime provider classes")
    void classpathShouldNotProvideOpenAiRuntimeProviderClasses() {
        assertThatThrownBy(() -> Class.forName("org.springframework.ai.openai.OpenAiChatModel"))
                .isInstanceOf(ClassNotFoundException.class);
    }

    @Test
    @DisplayName("build policy should reject OpenAI or LangChain dependency drift")
    void buildPolicyShouldRejectOpenAiOrLangChainDependencyDrift() throws IOException {
        String buildScript = Files.readString(Path.of("build.gradle"));

        assertThat(buildScript)
                .contains("verifyGeminiOnlyDependencies")
                .contains("forbiddenAiDependencyFragments")
                .contains("openai")
                .contains("langchain4j");
    }

    private Properties loadProperties(Path path) throws IOException {
        Properties properties = new Properties();
        try (var reader = Files.newBufferedReader(path)) {
            properties.load(reader);
        }
        return properties;
    }
}
