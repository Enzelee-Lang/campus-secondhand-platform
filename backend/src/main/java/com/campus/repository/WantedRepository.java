package com.campus.repository;

import com.campus.entity.Wanted;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WantedRepository extends JpaRepository<Wanted, Long> {

    List<Wanted> findByStatusOrderByCreateTimeDesc(Integer status);

    List<Wanted> findByPublisherIdOrderByCreateTimeDesc(Long publisherId);

    List<Wanted> findAllByOrderByCreateTimeDesc();
}
