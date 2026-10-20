package com.campus.controller;

import com.campus.entity.Report;
import com.campus.repository.ReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ReportController 单元测试
 */
@WebMvcTest(ReportController.class)
@ActiveProfiles("test")
class ReportControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean ReportRepository reportRepository;

    private Report sample() {
        Report r = new Report();
        r.setReportId(1L); r.setReporterId(2L); r.setItemId(1L);
        r.setReason("虚假描述"); r.setStatus(0);
        return r;
    }

    @Test
    @DisplayName("POST /api/reports: 提交举报 → 自动 status=0")
    void create() throws Exception {
        Report input = new Report();
        input.setReporterId(2L); input.setItemId(1L); input.setReason("虚假描述");
        when(reportRepository.save(any(Report.class))).thenReturn(sample());

        mockMvc.perform(post("/api/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(input)))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("GET /api/reports: 全部举报（无筛选）")
    void list_noStatus() throws Exception {
        when(reportRepository.findAll()).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/reports"))
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data[0].reportId").value(1));
    }

    @Test
    @DisplayName("GET /api/reports?status=0: 按状态筛选")
    void list_withStatus() throws Exception {
        when(reportRepository.findByStatus(0)).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/reports").param("status", "0"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/reports/{id}/handle: 处理举报")
    void handle_found() throws Exception {
        Report r = sample();
        when(reportRepository.findById(1L)).thenReturn(Optional.of(r));
        when(reportRepository.save(any(Report.class))).thenReturn(r);

        mockMvc.perform(put("/api/reports/1/handle").param("status", "1"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/reports/{id}/handle: 举报不存在 → 404")
    void handle_notFound() throws Exception {
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/reports/999/handle").param("status", "1"))
            .andExpect(jsonPath("$.code").value(404));
    }
}
