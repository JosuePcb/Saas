package com.saas.modules.billing.dtos;

import com.saas.modules.billing.models.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", source = "tenantId")
    @Mapping(target = "method", source = "request.method")
    @Mapping(target = "status", expression = "java(com.saas.modules.billing.models.PaymentStatus.PENDING_VALIDATION)")
    @Mapping(target = "amount", source = "request.amount")
    @Mapping(target = "referenceNumber", source = "request.referenceNumber")
    @Mapping(target = "paymentDateTime", source = "request.paymentDateTime")
    @Mapping(target = "evidenceUrl", expression = "java(request.evidenceUrl().trim())")
    @Mapping(target = "decisionComment", ignore = true)
    @Mapping(target = "reviewedByUserId", ignore = true)
    @Mapping(target = "reviewedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Payment toEntity(CreatePaymentRequest request, java.util.UUID tenantId);

    PaymentResponse toResponse(Payment payment);
}
