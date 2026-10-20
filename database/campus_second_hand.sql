-- MySQL dump 10.13  Distrib 9.5.0, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: campus_second_hand
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '74766d57-c06d-11f0-ac16-6cf06c4e415b:1-915';

--
-- Table structure for table `t_admin`
--

DROP TABLE IF EXISTS `t_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_admin` (
  `admin_id` bigint NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(50) NOT NULL COMMENT '管理员用户名',
  `password` varchar(100) NOT NULL COMMENT '管理员密码(加密存储)',
  `role` tinyint NOT NULL DEFAULT '2' COMMENT '角色:1超级管理员 2普通管理员',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:0禁用 1启用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `uk_admin_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_admin`
--

LOCK TABLES `t_admin` WRITE;
/*!40000 ALTER TABLE `t_admin` DISABLE KEYS */;
INSERT INTO `t_admin` VALUES (1,'admin','e10adc3949ba59abbe56e057f20f883e',1,1,'2026-09-02 20:28:21');
/*!40000 ALTER TABLE `t_admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_category`
--

DROP TABLE IF EXISTS `t_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_category` (
  `category_id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `parent_id` bigint DEFAULT NULL COMMENT '父分类ID,NULL表示一级分类',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序序号',
  PRIMARY KEY (`category_id`),
  KEY `fk_category_parent` (`parent_id`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `t_category` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商品分类表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_category`
--

LOCK TABLES `t_category` WRITE;
/*!40000 ALTER TABLE `t_category` DISABLE KEYS */;
INSERT INTO `t_category` VALUES (1,'教材书籍',NULL,1),(2,'电子产品',NULL,2),(3,'生活用品',NULL,3),(4,'运动器材',NULL,4),(5,'服饰美妆',NULL,5),(6,'其他',NULL,6);
/*!40000 ALTER TABLE `t_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_favorite`
--

DROP TABLE IF EXISTS `t_favorite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_favorite` (
  `user_id` bigint NOT NULL COMMENT '收藏用户ID,外键→t_user',
  `item_id` bigint NOT NULL COMMENT '被收藏商品ID,外键→t_item',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`user_id`,`item_id`),
  KEY `fk_fav_item` (`item_id`),
  CONSTRAINT `fk_fav_item` FOREIGN KEY (`item_id`) REFERENCES `t_item` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='收藏表(用户-商品多对多中间表)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_favorite`
--

LOCK TABLES `t_favorite` WRITE;
/*!40000 ALTER TABLE `t_favorite` DISABLE KEYS */;
INSERT INTO `t_favorite` VALUES (1,4,'2026-09-02 20:28:21'),(2,1,'2026-09-02 20:28:21'),(3,1,'2026-09-02 20:50:29'),(3,6,'2026-09-02 20:28:21');
/*!40000 ALTER TABLE `t_favorite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_item`
--

DROP TABLE IF EXISTS `t_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_item` (
  `item_id` bigint NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `user_id` bigint NOT NULL COMMENT '发布者(卖家)ID,外键→t_user',
  `category_id` bigint NOT NULL COMMENT '所属分类ID,外键→t_category',
  `title` varchar(100) NOT NULL COMMENT '商品标题',
  `description` varchar(1000) DEFAULT NULL COMMENT '商品描述',
  `price` decimal(10,2) NOT NULL COMMENT '售价',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `condition_level` tinyint NOT NULL COMMENT '成色等级1-10',
  `images` varchar(1000) DEFAULT NULL COMMENT '商品图片URL(JSON数组)',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:0下架 1在售 2已售',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览量',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`item_id`),
  KEY `idx_item_create_time` (`create_time`),
  KEY `fk_item_user` (`user_id`),
  KEY `fk_item_category` (`category_id`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `t_category` (`category_id`),
  CONSTRAINT `fk_item_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商品表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_item`
--

LOCK TABLES `t_item` WRITE;
/*!40000 ALTER TABLE `t_item` DISABLE KEYS */;
INSERT INTO `t_item` VALUES (1,1,1,'高等数学（第七版）上册','同济大学版，考研经典教材，无笔记无划痕',15.00,52.00,2,NULL,1,128,'2026-09-02 20:28:21','2026-09-02 20:28:21'),(2,1,2,'罗技无线鼠标 M275','办公用，灵敏好用，电池耐用',35.00,89.00,2,NULL,1,76,'2026-09-02 20:28:21','2026-09-02 20:28:21'),(3,2,3,'宿舍小风扇 USB充电款','三档风力，静音，充一次用一晚上',20.00,45.00,3,NULL,1,54,'2026-09-02 20:28:21','2026-09-02 20:28:21'),(4,2,4,'羽毛球拍 一对装','含拍套，九成新，附赠三个球',60.00,160.00,2,NULL,1,39,'2026-09-02 20:28:21','2026-09-02 20:28:21'),(5,3,5,'冬季加绒卫衣 M码','穿过一两次，洗过，无起球',40.00,129.00,3,NULL,1,21,'2026-09-02 20:28:21','2026-09-02 20:28:21'),(6,3,6,'吉他初学者 41寸民谣','含琴包变调夹，学了一年闲置',280.00,699.00,3,NULL,1,95,'2026-09-02 20:28:21','2026-09-02 20:28:21');
/*!40000 ALTER TABLE `t_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_message`
--

DROP TABLE IF EXISTS `t_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_message` (
  `msg_id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `sender_id` bigint NOT NULL COMMENT '发送者ID,外键→t_user',
  `receiver_id` bigint NOT NULL COMMENT '接收者ID,外键→t_user',
  `item_id` bigint DEFAULT NULL COMMENT '关联商品ID(议价会话),外键→t_item',
  `content` varchar(1000) NOT NULL COMMENT '消息内容',
  `msg_type` tinyint NOT NULL DEFAULT '1' COMMENT '消息类型:1文字 2图片',
  `is_read` tinyint NOT NULL DEFAULT '0' COMMENT '是否已读:0未读 1已读',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`msg_id`),
  KEY `fk_msg_sender` (`sender_id`),
  KEY `fk_msg_receiver` (`receiver_id`),
  KEY `fk_msg_item` (`item_id`),
  CONSTRAINT `fk_msg_item` FOREIGN KEY (`item_id`) REFERENCES `t_item` (`item_id`),
  CONSTRAINT `fk_msg_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `t_user` (`user_id`),
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `t_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='聊天消息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_message`
--

LOCK TABLES `t_message` WRITE;
/*!40000 ALTER TABLE `t_message` DISABLE KEYS */;
INSERT INTO `t_message` VALUES (1,2,1,1,'你好，这本高数还在吗？',1,1,'2026-09-02 20:28:21'),(2,1,2,1,'在的，需要我拍照给你看看吗？',1,1,'2026-09-02 20:28:21'),(3,3,1,1,'同学你好，价格还能便宜点吗？',1,0,'2026-09-02 20:28:21');
/*!40000 ALTER TABLE `t_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_report`
--

DROP TABLE IF EXISTS `t_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_report` (
  `report_id` bigint NOT NULL AUTO_INCREMENT COMMENT '举报ID',
  `reporter_id` bigint NOT NULL COMMENT '举报人ID,外键→t_user',
  `item_id` bigint DEFAULT NULL COMMENT '被举报商品ID(举报商品时非空),外键→t_item',
  `reported_user_id` bigint DEFAULT NULL COMMENT '被举报用户ID(举报用户时非空),外键→t_user',
  `reason` varchar(200) NOT NULL COMMENT '举报原因',
  `evidence` varchar(1000) DEFAULT NULL COMMENT '证据图片URL',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '处理状态:0待处理 1已处理',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '举报时间',
  PRIMARY KEY (`report_id`),
  KEY `fk_report_reporter` (`reporter_id`),
  KEY `fk_report_item` (`item_id`),
  KEY `fk_report_target` (`reported_user_id`),
  CONSTRAINT `fk_report_item` FOREIGN KEY (`item_id`) REFERENCES `t_item` (`item_id`),
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `t_user` (`user_id`),
  CONSTRAINT `fk_report_target` FOREIGN KEY (`reported_user_id`) REFERENCES `t_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='举报表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_report`
--

LOCK TABLES `t_report` WRITE;
/*!40000 ALTER TABLE `t_report` DISABLE KEYS */;
INSERT INTO `t_report` VALUES (1,1,5,3,'描述与实物不符，图片与实物差距较大','订单聊天截图',0,'2026-09-02 20:28:21'),(2,1,6,3,'商品描述与实物差距较大',NULL,0,'2026-09-02 20:50:29');
/*!40000 ALTER TABLE `t_report` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_review`
--

DROP TABLE IF EXISTS `t_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_review` (
  `review_id` bigint NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `reviewer_id` bigint NOT NULL COMMENT '评价者(买家)ID,外键→t_user',
  `target_user_id` bigint NOT NULL COMMENT '被评价者(卖家)ID,外键→t_user',
  `item_id` bigint NOT NULL COMMENT '关联商品ID,外键→t_item',
  `rating` tinyint NOT NULL COMMENT '评分1-5星',
  `content` varchar(500) NOT NULL COMMENT '评价内容',
  `reply` varchar(500) DEFAULT NULL COMMENT '卖家回复内容',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
  PRIMARY KEY (`review_id`),
  KEY `fk_review_reviewer` (`reviewer_id`),
  KEY `fk_review_target_user` (`target_user_id`),
  KEY `fk_review_item` (`item_id`),
  CONSTRAINT `fk_review_item` FOREIGN KEY (`item_id`) REFERENCES `t_item` (`item_id`),
  CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `t_user` (`user_id`),
  CONSTRAINT `fk_review_target_user` FOREIGN KEY (`target_user_id`) REFERENCES `t_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='交易评价表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_review`
--

LOCK TABLES `t_review` WRITE;
/*!40000 ALTER TABLE `t_review` DISABLE KEYS */;
INSERT INTO `t_review` VALUES (1,2,1,1,5,'书很新，卖家发货快，交易愉快！','谢谢支持，祝学业顺利~','2026-09-02 20:28:21'),(2,3,2,4,4,'球拍成色不错，就是价格还可以再商量','已经很优惠啦，感谢惠顾','2026-09-02 20:28:21');
/*!40000 ALTER TABLE `t_review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_user`
--

DROP TABLE IF EXISTS `t_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码(加密存储)',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `student_id` varchar(30) NOT NULL COMMENT '学号(本校身份校验)',
  `school_name` varchar(100) NOT NULL COMMENT '学校名称',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:0禁用 1正常',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_user_username` (`username`),
  UNIQUE KEY `uk_user_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_user`
--

LOCK TABLES `t_user` WRITE;
/*!40000 ALTER TABLE `t_user` DISABLE KEYS */;
INSERT INTO `t_user` VALUES (1,'张三','e10adc3949ba59abbe56e057f20f883e','zhangsan@campus.edu.cn','13800000001',NULL,'20238111101','XX大学',1,'2026-09-02 20:28:21'),(2,'李四','e10adc3949ba59abbe56e057f20f883e','lisi@campus.edu.cn','13800000002',NULL,'20238111102','XX大学',1,'2026-09-02 20:28:21'),(3,'王五','e10adc3949ba59abbe56e057f20f883e','wangwu@campus.edu.cn','13800000003',NULL,'20238111103','XX大学',1,'2026-09-02 20:28:21');
/*!40000 ALTER TABLE `t_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'campus_second_hand'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-02 20:59:35
