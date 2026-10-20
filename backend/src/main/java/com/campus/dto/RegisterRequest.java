package com.campus.dto;

import lombok.Data;

/**
 * 注册请求
 */
@Data
public class RegisterRequest {

    private String username;
    private String password;
    private String email;
    private String phone;
    private String studentId;
    private String schoolName;
}
