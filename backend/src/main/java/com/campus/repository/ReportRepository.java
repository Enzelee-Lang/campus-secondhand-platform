package com.campus.repository;

import com.campus.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(Integer status);

    List<Report> findByReporterId(Long reporterId);
}
