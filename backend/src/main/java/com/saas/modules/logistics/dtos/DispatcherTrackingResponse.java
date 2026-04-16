package com.saas.modules.logistics.dtos;

import java.util.List;

public record DispatcherTrackingResponse(
        List<DispatcherOrderSummaryResponse> orders
) {
}
