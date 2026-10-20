package com.campus.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Md5Util 单元测试
 */
class Md5UtilTest {

    @Test
    @DisplayName("md5: 空字符串 → 正确哈希")
    void md5_empty() {
        // MD5("") = d41d8cd98f00b204e9800998ecf8427e
        assertEquals("d41d8cd98f00b204e9800998ecf8427e", Md5Util.md5(""));
    }

    @Test
    @DisplayName("md5: 已知输入 → 正确哈希")
    void md5_knownInput() {
        // MD5("123456") = e10adc3949ba59abbe56e057f20f883e
        assertEquals("e10adc3949ba59abbe56e057f20f883e", Md5Util.md5("123456"));
    }

    @Test
    @DisplayName("md5: 中文输入 → 正确哈希")
    void md5_chinese() {
        // MD5("你好") 的小写十六进制
        String hash = Md5Util.md5("你好");
        assertNotNull(hash);
        assertEquals(32, hash.length());
        // 手工校验一次：MD5("你好") = 7eca689f0d3389dea64724ef8caa571b
        assertEquals("7eca689f0d3389d9dea66ae112e5cfd7", hash);
    }

    @Test
    @DisplayName("md5: 每次调用结果一致（幂等）")
    void md5_idempotent() {
        String a = Md5Util.md5("campus2026");
        String b = Md5Util.md5("campus2026");
        assertEquals(a, b);
    }

    @Test
    @DisplayName("md5: 不同输入 → 不同输出")
    void md5_differentInputs() {
        assertNotEquals(Md5Util.md5("abc"), Md5Util.md5("abd"));
    }

    @Test
    @DisplayName("md5: 输出全为小写十六进制字符")
    void md5_hexFormat() {
        String hash = Md5Util.md5("test");
        assertTrue(hash.matches("[0-9a-f]{32}"), "应输出 32 位小写十六进制");
    }
}
