package com.saas.core.tenant;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.springframework.context.annotation.Configuration;

import java.util.UUID;

@Configuration
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = UUID.class))
public class TenantFilterConfiguration {
}
