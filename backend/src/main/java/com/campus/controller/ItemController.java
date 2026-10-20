package com.campus.controller;

import com.campus.common.Result;
import com.campus.dto.CursorPageVo;
import com.campus.entity.Item;
import com.campus.entity.PriceHistory;
import com.campus.repository.ItemRepository;
import com.campus.repository.PriceHistoryRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 商品接口
 */
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemRepository itemRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    /** 在售商品列表（传统全量，可传 categoryId / keyword 过滤；向后兼容） */
    @GetMapping
    public Result<List<Item>> list(@RequestParam(required = false) Long categoryId,
                                   @RequestParam(required = false) String keyword) {
        List<Item> all = itemRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime"));
        if (categoryId != null) {
            all = all.stream().filter(i -> categoryId.equals(i.getCategoryId())).collect(Collectors.toList());
        }
        if (keyword != null && !keyword.isBlank()) {
            String k = keyword.toLowerCase();
            all = all.stream().filter(i -> {
                String t = i.getTitle() == null ? "" : i.getTitle().toLowerCase();
                String d = i.getDescription() == null ? "" : i.getDescription().toLowerCase();
                return t.contains(k) || d.contains(k);
            }).collect(Collectors.toList());
        }
        return Result.ok(all);
    }

    /**
     * 游标分页查询（视频里老师用的 CursorPageVo）
     *
     * <p>请求参数：
     * <ul>
     *     <li>cursor - 上一页最后一条记录的 createTime（ISO-8601 格式，如 2026-09-02T22:00:00）；首次请求不传或传 null</li>
     *     <li>pageSize - 每页条数，默认 10，最大 100</li>
     *     <li>categoryId - 可选，按分类过滤</li>
     *     <li>keyword - 可选，按标题模糊过滤</li>
     * </ul>
     *
     * <p>响应：CursorPageVo，包含 entityList / hasNextPage / nextCursor / pageSize
     */
    @GetMapping("/page")
    public Result<CursorPageVo<Item>> listByCursor(
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {

        int safeSize = Math.max(1, Math.min(pageSize == null ? 10 : pageSize, 100));
        // 多查一条用于判断是否还有下一页
        Pageable pageable = PageRequest.of(0, safeSize + 1, Sort.by(Sort.Direction.DESC, "createTime"));
        LocalDateTime cursorTime = parseCursor(cursor);

        List<Item> rows;
        if (categoryId != null) {
            rows = itemRepository.findByCategoryIdAndCursor(categoryId, cursorTime, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            rows = itemRepository.findByKeywordAndCursor(keyword.trim(), cursorTime, pageable);
        } else {
            rows = itemRepository.findByCursor(cursorTime, pageable);
        }

        boolean hasNext = rows.size() > safeSize;
        if (hasNext) {
            rows = rows.subList(0, safeSize);
        }
        String nextCursor = null;
        if (hasNext && !rows.isEmpty()) {
            Item last = rows.get(rows.size() - 1);
            if (last.getCreateTime() != null) {
                nextCursor = last.getCreateTime().toString();
            }
        }

        return Result.ok(CursorPageVo.of(rows, hasNext, nextCursor, safeSize));
    }

    /** 商品详情（浏览量+1） */
    @GetMapping("/{id}")
    public Result<Item> detail(@PathVariable Long id) {
        return itemRepository.findById(id).map(item -> {
            item.setViewCount(item.getViewCount() == null ? 1 : item.getViewCount() + 1);
            itemRepository.save(item);
            return Result.ok(item);
        }).orElse(Result.error(404, "商品不存在"));
    }

    /** 某用户发布的商品 */
    @GetMapping("/user/{userId}")
    public Result<List<Item>> byUser(@PathVariable Long userId) {
        return Result.ok(itemRepository.findByUserId(userId));
    }

    /**
     * 商品导出 CSV（视频里老师用的导出方式：ServletOutputStream + BufferedWriter 输出 CSV）
     *
     * <p>支持 categoryId 过滤；CSV 文件包含 UTF-8 BOM，Excel 直接打开不会中文乱码。
     */
    @GetMapping("/export")
    public void export(@RequestParam(required = false) Long categoryId,
                       HttpServletResponse response) throws IOException {
        List<Item> items;
        if (categoryId != null) {
            items = itemRepository.findByCategoryId(categoryId);
        } else {
            items = itemRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime"));
        }

        String filename = "items_" + LocalDate.now() + ".csv";
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        response.setContentType("text/csv;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + encoded + "\"");

        try (PrintWriter writer = response.getWriter()) {
            // 写 UTF-8 BOM，Excel 才能正确识别中文
            writer.write('\ufeff');
            // 表头
            writer.println("商品ID,标题,描述,售价,原价,成色,状态,浏览量,发布时间");
            // 数据行
            for (Item item : items) {
                writer.println(toCsvRow(item));
            }
            writer.flush();
        }
    }

    /** 发布商品 */
    @PostMapping
    public Result<Item> create(@RequestBody Item item) {
        item.setStatus(1);
        return Result.ok(itemRepository.save(item));
    }

    /** 修改商品 */
    @PutMapping("/{id}")
    public Result<Item> update(@PathVariable Long id, @RequestBody Item patch) {
        return itemRepository.findById(id).map(item -> {
            if (patch.getTitle() != null) item.setTitle(patch.getTitle());
            if (patch.getDescription() != null) item.setDescription(patch.getDescription());
            if (patch.getPrice() != null) item.setPrice(patch.getPrice());
            if (patch.getOriginalPrice() != null) item.setOriginalPrice(patch.getOriginalPrice());
            if (patch.getConditionLevel() != null) item.setConditionLevel(patch.getConditionLevel());
            if (patch.getImages() != null) item.setImages(patch.getImages());
            if (patch.getCategoryId() != null) item.setCategoryId(patch.getCategoryId());
            if (patch.getStatus() != null) item.setStatus(patch.getStatus());
            return Result.ok(itemRepository.save(item));
        }).orElse(Result.error(404, "商品不存在"));
    }

    /** 删除商品 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        itemRepository.deleteById(id);
        return Result.ok();
    }

    // ============== 价格修改模块 ==============

    /**
     * 修改商品价格
     * body: { newPrice, changedBy, remark }
     * 权限：仅商品所有者(userId 匹配)或管理员可操作
     */
    @PutMapping("/{id}/price")
    public Result<Item> changePrice(@PathVariable Long id, @RequestBody PriceChangeRequest req) {
        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) return Result.error(404, "商品不存在");
        // 权限校验：仅所有者或管理员
        boolean isOwner = item.getUserId().equals(req.getChangedBy());
        if (!isOwner && !Boolean.TRUE.equals(req.getIsAdmin())) {
            return Result.error(403, "无权修改该商品价格");
        }
        // 数据验证
        if (req.getNewPrice() == null || req.getNewPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return Result.error(400, "价格必须为大于 0 的有效数字");
        }
        if (req.getNewPrice().scale() > 2) {
            return Result.error(400, "价格最多保留两位小数");
        }
        java.math.BigDecimal oldPrice = item.getPrice();
        if (oldPrice.compareTo(req.getNewPrice()) == 0) {
            return Result.error(400, "新价格与原价格相同，无需修改");
        }
        // 更新价格
        item.setPrice(req.getNewPrice());
        itemRepository.save(item);
        // 记录历史
        PriceHistory h = new PriceHistory();
        h.setItemId(id);
        h.setOldPrice(oldPrice);
        h.setNewPrice(req.getNewPrice());
        h.setChangedBy(req.getChangedBy());
        h.setRemark(req.getRemark());
        priceHistoryRepository.save(h);
        return Result.ok(item);
    }

    /** 价格修改历史 */
    @GetMapping("/{id}/price-history")
    public Result<List<PriceHistory>> priceHistory(@PathVariable Long id) {
        return Result.ok(priceHistoryRepository.findByItemIdOrderByCreateTimeDesc(id));
    }

    /** 价格修改请求体 */
    @lombok.Data
    public static class PriceChangeRequest {
        private java.math.BigDecimal newPrice;
        private Long changedBy;
        private Boolean isAdmin;
        private String remark;
    }

    // ============== 私有工具方法 ==============

    /** 解析 cursor 字符串，解析失败返回 null（视为首屏） */
    private LocalDateTime parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(cursor);
        } catch (Exception ignore) {
            return null;
        }
    }

    /** 把单条商品数据格式化为 CSV 一行 */
    private String toCsvRow(Item item) {
        return String.format("%d,%s,%s,%s,%s,%s,%d,%d,%s",
                item.getItemId(),
                csvEscape(item.getTitle()),
                csvEscape(item.getDescription()),
                item.getPrice() == null ? "" : item.getPrice().toPlainString(),
                item.getOriginalPrice() == null ? "" : item.getOriginalPrice().toPlainString(),
                conditionName(item.getConditionLevel()),
                item.getStatus() == null ? "" : item.getStatus(),
                item.getViewCount() == null ? 0 : item.getViewCount(),
                item.getCreateTime() == null ? "" : item.getCreateTime().toString());
    }

    /** CSV 字段转义：包含逗号、双引号、换行时用双引号包裹，内部双引号转义为两个 */
    private String csvEscape(String s) {
        if (s == null) {
            return "";
        }
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    /** 成色枚举映射成中文 */
    private String conditionName(Integer level) {
        if (level == null) {
            return "";
        }
        return switch (level) {
            case 1 -> "全新";
            case 2 -> "几乎全新";
            case 3 -> "轻微使用";
            case 4 -> "明显使用痕迹";
            case 5 -> "已磨损";
            default -> "未知";
        };
    }
}
