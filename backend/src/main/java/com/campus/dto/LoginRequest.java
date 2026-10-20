package com.campus.dto;

import lombok.Data;

/**
 * 登录请求
 */
@Data
public class LoginRequest {

    private String username;
    private String password;
    /** user-用户登录 admin-管理员登录 */
    private String type;
}
