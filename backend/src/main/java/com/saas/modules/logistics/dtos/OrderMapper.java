package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.OrderStatusHistory;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    OrderResponse toResponse(Order order);

    OrderHistoryResponse toHistoryResponse(OrderStatusHistory history);
}
