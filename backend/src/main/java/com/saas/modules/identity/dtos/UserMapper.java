package com.saas.modules.identity.dtos;

import com.saas.modules.identity.models.User;
import com.saas.modules.identity.models.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "activo", source = "activo")
    UserResponse toResponse(User user);
}
