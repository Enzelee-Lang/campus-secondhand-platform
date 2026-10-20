package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Item;
import com.campus.entity.Order;
import com.campus.repository.ItemRepository;
import com.campus.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 订单接口 —— 商品全生命周期状态管理
 * 状态: 0-待确认 1-待支付 2-待发货 3-已发货 4-已完成 5-已取消
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;

    /** 创建订单（买家下单）—— 同一买家对同一商品的进行中订单幂等去重 */
    @PostMapping
    public Result<Order> create(@RequestBody Order order) {
        Item item = itemRepository.findById(order.getItemId()).orElse(null);
        if (item == null) return Result.error(404, "商品不存在");
        if (item.getStatus() != 1) return Result.error(400, "商品已下架或已售出");
        if (order.getBuyerId() == null || order.getSellerId() == null)
            return Result.error(400, "买家/卖家不能为空");
        if (order.getBuyerId().equals(order.getSellerId()))
            return Result.error(400, "不能购买自己的商品");
        // 防重复下单：该买家对此商品已有未完成订单时直接返回已有订单
        List<Order> mine = orderRepository.findByBuyerId(order.getBuyerId());
        for (Order o : mine) {
            if (o.getItemId().equals(order.getItemId()) && o.getStatus() < 5) {
                return Result.ok(o);
            }
        }
        // 金额取商品现价
        order.setAmount(item.getPrice());
        order.setStatus(0); // 待确认
        order.setOrderNo(genOrderNo());
        return Result.ok(orderRepository.save(order));
    }

    /** 我的全部订单（买家+卖家一次返回，供订单页/聊天页减少请求数） */
    @GetMapping("/mine")
    public Result<List<Order>> mine(@RequestParam Long userId) {
        List<Order> list = new java.util.ArrayList<>();
        list.addAll(orderRepository.findByBuyerId(userId));
        list.addAll(orderRepository.findBySellerId(userId));
        list.sort(java.util.Comparator.comparing(Order::getCreateTime,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
        return Result.ok(list);
    }

    /** 订单详情 */
    @GetMapping("/{id}")
    public Result<Order> detail(@PathVariable Long id) {
        return orderRepository.findById(id).map(Result::ok).orElse(Result.error(404, "订单不存在"));
    }

    /** 我作为买家的订单 */
    @GetMapping("/buyer/{userId}")
    public Result<List<Order>> buyerOrders(@PathVariable Long userId) {
        return Result.ok(orderRepository.findByBuyerId(userId));
    }

    /** 我作为卖家的订单 */
    @GetMapping("/seller/{userId}")
    public Result<List<Order>> sellerOrders(@PathVariable Long userId) {
        return Result.ok(orderRepository.findBySellerId(userId));
    }

    /** 全部订单（管理员） */
    @GetMapping
    public Result<List<Order>> all(@RequestParam(required = false) Integer status) {
        List<Order> list = status != null
                ? orderRepository.findByStatus(status)
                : orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime"));
        return Result.ok(list);
    }

    /** 订单统计 */
    @GetMapping("/stats")
    public Result<java.util.Map<String, Long>> stats() {
        java.util.Map<String, Long> m = new java.util.HashMap<>();
        m.put("pending", orderRepository.countByStatus(0));
        m.put("paid", orderRepository.countByStatus(2));
        m.put("shipped", orderRepository.countByStatus(3));
        m.put("completed", orderRepository.countByStatus(4));
        m.put("cancelled", orderRepository.countByStatus(5));
        return Result.ok(m);
    }

    /**
     * 状态流转
     * action: confirm(卖家确认) pay(买家支付) ship(卖家发货) complete(买家确认完成) cancel(取消)
     * userId: 操作者身份，用于角色权限校验（confirm/ship=卖家，pay/complete=买家，cancel=双方）
     */
    @PutMapping("/{id}/status")
    public Result<Order> changeStatus(@PathVariable Long id, @RequestParam String action,
                                      @RequestParam(required = false) Long userId) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return Result.error(404, "订单不存在");
        // 角色权限校验：传了 userId 就校验操作者角色
        if (userId != null) {
            boolean isBuyer = userId.equals(order.getBuyerId());
            boolean isSeller = userId.equals(order.getSellerId());
            boolean allowed = switch (action) {
                case "confirm", "ship" -> isSeller;
                case "pay", "complete" -> isBuyer;
                case "cancel" -> isBuyer || isSeller;
                default -> false;
            };
            if (!allowed) return Result.error(403, "当前角色无权执行该操作");
        }
        int cur = order.getStatus();
        switch (action) {
            case "confirm":
                if (cur != 0) return Result.error(400, "当前状态不可确认");
                order.setStatus(1); // 待支付
                break;
            case "pay":
                if (cur != 1) return Result.error(400, "当前状态不可支付");
                order.setStatus(2); // 待发货
                break;
            case "ship":
                if (cur != 2) return Result.error(400, "当前状态不可发货");
                order.setStatus(3); // 已发货
                break;
            case "complete":
                if (cur != 3) return Result.error(400, "当前状态不可完成");
                order.setStatus(4); // 已完成
                // 商品标记为已售出
                itemRepository.findById(order.getItemId()).ifPresent(it -> {
                    it.setStatus(3);
                    itemRepository.save(it);
                });
                break;
            case "cancel":
                if (cur >= 4) return Result.error(400, "已完成订单不可取消");
                order.setStatus(5);
                break;
            default:
                return Result.error(400, "未知操作: " + action);
        }
        order.setUpdateTime(LocalDateTime.now());
        return Result.ok(orderRepository.save(order));
    }

    /** 卖家填写物流单号 */
    @PutMapping("/{id}/shipping")
    public Result<Order> setShipping(@PathVariable Long id, @RequestParam String shippingNo) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return Result.error(404, "订单不存在");
        order.setShippingNo(shippingNo);
        return Result.ok(orderRepository.save(order));
    }

    private String genOrderNo() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "ORD" + ts + rand;
    }
}
