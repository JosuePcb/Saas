# Fase 6 release and rollback readiness checklist

## Scope

This checklist is focused on `fase-6-prd-alignment-core` final readiness with Gemini-only policy enforcement, configuration hardening, and regression safety before release.

## Release readiness checks

1) Gemini-only policy

- [ ] Confirm no OpenAI/LangChain references remain in product docs:
  - `PRD.md`
- [ ] Confirm runtime properties enforce Gemini-only:
  - `spring.ai.model.chat=google-genai`
  - `spring.ai.google.genai.api-key` is set from environment.
  - `spring.autoconfigure.exclude` includes `org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration`.
- [ ] Confirm test properties preserve Gemini path and exclude OpenAI:
  - `src/test/resources/application-test.properties`
- [ ] Run `./gradlew verifyGeminiOnlyDependencies`.

2) Batch 6 regression and alignment checks

- [ ] Run configuration policy tests:
  - `./gradlew test --tests "com.saas.core.config.AiProviderConfigurationPolicyTest"`
- [ ] Run readiness integration regression:
  - `./gradlew test --tests "com.saas.core.regression.Fase6AlignmentReadinessIntegrationTest"`
- [ ] Run AI normalization + route optimization integration regression:
  - `./gradlew test --tests "com.saas.modules.ai.controllers.AiAddressNormalizationControllerIntegrationTest"`
- [ ] Optional broader check (recommended):
  - `./gradlew check`

3) Security and endpoint expectations

- [ ] Anonymous access remains valid only for tracking endpoints:
  - `/api/tracking/{trackingCode}`
  - `/api/public/tracking/{trackingCode}`
- [ ] SuperAdmin panel remains protected:
  - `/api/admin/**` must return `401` without token, `403` for non-SUPER_ADMIN.

4) Data and migration safeguards

- [ ] Validate Flyway `V15` and `V16` are applied successfully in target environment.
- [ ] Confirm no schema drift for PRD alignment columns/tables and indexes.
- [ ] Confirm `ai_normalization_logs.model_name` persists `gemini` for new normalization attempts.

## Rollback readiness checks

- [ ] Rollback owner identified and on-call for deployment window.
- [ ] DB backup/snapshot completed before rollout.
- [ ] Compensating migration strategy reviewed from:
  - `docs/runbooks/fase6-v15-rollback.md`
- [ ] Post-rollback smoke tests prepared:
  - Auth `401/403` semantics.
  - Public tracking endpoint response.
  - Admin tenant panel authz guard.

## Go/No-Go decision

Go only if all mandatory checks above pass, especially Gemini-only policy checks and Batch 6 regressions.
