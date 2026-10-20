package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Report;
import com.campus.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 举报接口
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;

    /** 提交举报 */
    @PostMapping
    public Result<Report> create(@RequestBody Report report) {
        report.setStatus(0);
        return Result.ok(reportRepository.save(report));
    }

    /** 举报列表（管理端） */
    @GetMapping
    public Result<List<Report>> list(@RequestParam(required = false) Integer status) {
        if (status == null) {
            return Result.ok(reportRepository.findAll());
        }
        return Result.ok(reportRepository.findByStatus(status));
    }

    /** 处理举报（管理端） */
    @PutMapping("/{id}/handle")
    public Result<Report> handle(@PathVariable Long id, @RequestParam Integer status) {
        return reportRepository.findById(id).map(r -> {
            r.setStatus(status);
            return Result.ok(reportRepository.save(r));
        }).orElse(Result.error(404, "举报不存在"));
    }
}
