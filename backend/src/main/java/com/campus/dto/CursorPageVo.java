package com.campus.dto;

import lombok.Data;

import java.util.List;

/**
 * 游标分页结果（仿 CursorPageVo）
 *
 * <p>相比传统的 page/size 偏移分页，游标分页在大数据量下性能更稳定，
 * 不会因为深翻页导致数据库扫描成本陡增，且新增/删除数据时不会出现重复或漏读。
 *
 * @param <T> 实体类型
 */
@Data
public class CursorPageVo<T> {

    /** 当前页实体列表 */
    private List<T> entityList;

    /** 是否还有下一页 */
    private Boolean hasNextPage;

    /** 下一页游标（把当前页最后一条记录的"排序键"传给下次请求，传 null 表示首页） */
    private String nextCursor;

    /** 当前页实际条数（不超过 pageSize） */
    private Integer pageSize;

    public CursorPageVo() {
    }

    public CursorPageVo(List<T> entityList, Boolean hasNextPage, String nextCursor, Integer pageSize) {
        this.entityList = entityList;
        this.hasNextPage = hasNextPage;
        this.nextCursor = nextCursor;
        this.pageSize = pageSize;
    }

    /** 静态工厂：第一页/无下一页 */
    public static <T> CursorPageVo<T> of(List<T> list, boolean hasNextPage, String nextCursor, int pageSize) {
        return new CursorPageVo<>(list, hasNextPage, nextCursor, pageSize);
    }

    /** 兼容老字段名 entityList 的 getter（视频里类名风格） */
    public List<T> getEntityList() {
        return entityList;
    }

    public void setEntityList(List<T> entityList) {
        this.entityList = entityList;
    }
}
