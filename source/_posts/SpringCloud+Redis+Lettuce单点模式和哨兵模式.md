---
title: Spring Cloud+Redis+Lettuce 单点模式和哨兵模式
date: 2020-01-15 11:05:18
categories: [技术,后端,代码]
tags: [Spring,redis,lettuce,java]
description: Redis是一个开源的使用ANSI C语言编写、遵守BSD协议、支持网络、可基于内存亦可持久化的日志型、Key-Value数据库，并提供多种语言的API。
             它通常被称为数据结构服务器，因为值（value）可以是 字符串(String), 哈希(Hash), 列表(list), 集合(sets) 和 有序集合(sorted sets)等类型。
             Redis主要分为Standalone（单例模式）和Sentinel（哨兵模式）具体这个本篇文章不过多介绍

---

## 背景：

Redis是一个开源的使用ANSI C语言编写、遵守BSD协议、支持网络、可基于内存亦可持久化的日志型、Key-Value数据库，并提供多种语言的API。

它通常被称为数据结构服务器，因为值（value）可以是 字符串(String), 哈希(Hash), 列表(list), 集合(sets) 和 有序集合(sorted sets)等类型。

Redis主要分为Standalone（单例模式）和Sentinel（哨兵模式）具体这个本篇文章不过多介绍

**详细请看：**

1. [Redis哨兵（Sentinel）模式原理及搭建](https://blog.csdn.net/qq_35868811/article/details/90257045)
2. [深入剖析Redis系列(二) - Redis哨兵模式与高可用集群](https://juejin.im/post/5b7d226a6fb9a01a1e01ff64)

## 环境准备：

* redis ： 3.2.1
* os ：Linux2.6.32-696.30.1.el6.x86_64x86_64
* 数量：3 (三主三从)
* spring 2.1.* 或 spring2.0.*



## 配置集成：

**pom文件增加：**

```
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-data-redis</artifactId>
                <version>2.1.2.RELEASE</version>
            </dependency>
```

```
            <dependency>
                <groupId>org.apache.commons</groupId>
                <artifactId>commons-pool2</artifactId>
                <version>2.6.1</version>
            </dependency>
```




**java代码：**

下面部分应用层依然次用spring2.0.*的使用方式，这些方法可以实现功能，但是缺少原子性。笔者不是特别推荐。如实在嫌项目升级麻烦，这个也是可以的。

RedisTemplateConfig.class

```
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachingConfigurerSupport;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisNode;
import org.springframework.data.redis.connection.RedisSentinelConfiguration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

/**
 * redis 配置文件
 */
@EnableCaching
@Configuration
public class RedisTemplateConfig extends CachingConfigurerSupport {


    @Autowired
    private RedisPropertiesConfig redisPropertie;
    @Autowired
    private LettucePoolingClientConfiguration lettuceClientConfiguration;
    @Autowired
    private RedisSentinelConfiguration redisSentinelConfiguration;
    @Autowired
    private RedisStandaloneConfiguration redisStandaloneConfiguration;


    /**
     * redis哨兵配置
     *
     * @return
     */
    @Bean
    public RedisSentinelConfiguration redisSentinelConfiguration() {
        RedisSentinelConfiguration sentinelConfig = new RedisSentinelConfiguration();
        sentinelConfig.setMaster(redisPropertie.getMaster());
        Set<RedisNode> sentinels = new HashSet<>();
        String[] host = redisPropertie.getRedisNodes().split(",");
        for (String redisHost : host) {
            String[] item = redisHost.split(":");
            String ip = item[0].trim();
            String port = item[1].trim();
            sentinels.add(new RedisNode(ip, Integer.parseInt(port)));
        }
        sentinelConfig.setSentinels(sentinels);
        sentinelConfig.setDatabase(redisPropertie.getDatabase());
        //standConfig.setPassword(RedisPassword.of(redisPropertie.getPassword())); //redis 密码
        return sentinelConfig;
    }

    /**
     * redis 单节点配置
     *
     * @return
     */
    @Bean
    public RedisStandaloneConfiguration redisStandaloneConfiguration() {
        RedisStandaloneConfiguration standConfig = new RedisStandaloneConfiguration();
        standConfig.setHostName(redisPropertie.getHost());
        standConfig.setPort(redisPropertie.getPort());
        standConfig.setDatabase(redisPropertie.getDatabase());
        //standConfig.setPassword(RedisPassword.of(redisPropertie.getPassword()));  //redis 密码
        return standConfig;
    }


    /**
     * lettuce 连接池配置
     *
     * @return
     */
    @Bean
    public LettucePoolingClientConfiguration lettucePoolConfig() {
        GenericObjectPoolConfig poolConfig = new GenericObjectPoolConfig();

        poolConfig.setMaxTotal(redisPropertie.getMaxActive());
        poolConfig.setMinIdle(redisPropertie.getMinIdle());
        poolConfig.setMaxIdle(redisPropertie.getMaxIdle());
        poolConfig.setMaxWaitMillis(redisPropertie.getMaxWait());
        poolConfig.setTestOnCreate(redisPropertie.getTestOnCreate());
        poolConfig.setTestOnBorrow(redisPropertie.getTestOnBorrow());
        poolConfig.setTestOnReturn(redisPropertie.getTestOnReturn());
        poolConfig.setTestWhileIdle(redisPropertie.getTestWhileIdle());
        poolConfig.setNumTestsPerEvictionRun(redisPropertie.getNumTestsPerEvictionRun());
        poolConfig.setTimeBetweenEvictionRunsMillis(redisPropertie.getTimeBetweenEvictionRunsMillis());
        poolConfig.setMinEvictableIdleTimeMillis(redisPropertie.getMinEvictableIdleTimeMills());

        return LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .commandTimeout(Duration.ofSeconds(redisPropertie.getCommandTimeout()))
                .shutdownTimeout(Duration.ofMillis(redisPropertie.getShutdownTimeout()))
                .build();
    }

    /**
     * lettuce 连接工厂
     *
     * @return
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        LettuceConnectionFactory factory;
        if (redisPropertie.getCluster()) {
            factory = new LettuceConnectionFactory(redisSentinelConfiguration, lettuceClientConfiguration);
        } else {
            factory = new LettuceConnectionFactory(redisStandaloneConfiguration, lettuceClientConfiguration);
        }
        return factory;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        //StringRedisTemplate的构造方法中默认设置了stringSerializer
        RedisTemplate<String, Object> template = new RedisTemplate<>();

        template.setConnectionFactory(redisConnectionFactory());

        //设置开启事务
        //template.setEnableTransactionSupport(true);
        //set key serializer
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringRedisSerializer);
        template.setHashKeySerializer(stringRedisSerializer);
        template.setHashValueSerializer(stringRedisSerializer);

        template.afterPropertiesSet();
        return template;
    }

}
```

RedisPropertiesConfig.class

```
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import lombok.Data;


/**
 * redis 属性配置
 * @author Arber
 * @date 2019年5月12日 上午9:42:54
 * @version 1.0
 */
@Data
@Component
@Configuration
public class RedisPropertiesConfig {
    @Value("${spring.redis.sentinel.nodes}")
    private String redisNodes;
    @Value("${spring.redis.sentinel.master}")
    private String master;
    @Value("${spring.redis.sentinel.database:0}")
    private int database;
    
    //////////////////////// redis pool配置
    @Value("${spring.redis.pool.max_idle:500}")
    private Integer maxIdle;
    @Value("${spring.redis.pool.min_idle:200}")
    private Integer minIdle;
    @Value("${spring.redis.pool.max_active:2000}")
    private Integer maxActive;
    @Value("${spring.redis.pool.max_wait:5000}")
    private Integer maxWait;
    @Value("${spring.redis.pool.numTestsPerEvictionRun:200}")
    private Integer numTestsPerEvictionRun;//一次最多evict的pool里的jedis实例个数
    @Value("${spring.redis.pool.timeBetweenEvictionRunsMillis:6000}")
    private Integer timeBetweenEvictionRunsMillis;//test idle 线程的时间间隔\
    @Value("${spring.redis.pool.minEvictableIdleTimeMills:60000}")
    private Integer minEvictableIdleTimeMills;//连接池中连接可空闲的时间,毫秒
    @Value("${spring.redis.pool.test-on-create:false}")
    private Boolean testOnCreate;
    @Value("${spring.redis.pool.test-on-borrow:true}")
    private Boolean testOnBorrow;//在获取连接的时候检查有效性
    @Value("${spring.redis.pool.test-on-return:false}")
    private Boolean testOnReturn;//当调用return Object方法时，是否进行有效性检查
    @Value("${spring.redis.pool.test-while-idle:true}")
    private Boolean testWhileIdle;//在空闲时检查有效性
    @Value("${spring.redis.pool.commandTimeout:60}")
    private Integer commandTimeout;
    @Value("${spring.redis.pool.shutdownTimeout:100}")
    private Integer shutdownTimeout;

    ///////////////////////// redis 单节点配置，兼容集群问题
    @Value("${horder.redis.cluster:true}")
    private Boolean cluster; // 是否配置集群
    @Value("${spring.redis.host:172.22.0.22}")
    private String host;
    @Value("${spring.redis.port:26379}")
    private Integer port;
}

```

RedisLock.class

```
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisStringCommands;
import org.springframework.data.redis.connection.ReturnType;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.types.Expiration;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.nio.charset.Charset;
import java.util.concurrent.TimeUnit;

/**
 * @Description: 分布式锁工具类
 * @Author:Arber
 * @CreateDate: 2019年5月7日13:25:47
 */
@Component
@Slf4j
public class RedisLock {
    @Resource
    private RedisTemplate redisTemplate;

    public static final String UNLOCK_LUA;

    /**
     * 释放锁脚本，原子操作
     */
    static {
        StringBuilder sb = new StringBuilder();
        sb.append("if redis.call(\"get\",KEYS[1]) == ARGV[1] ");
        sb.append("then ");
        sb.append("    return redis.call(\"del\",KEYS[1]) ");
        sb.append("else ");
        sb.append("    return 0 ");
        sb.append("end ");
        UNLOCK_LUA = sb.toString();
    }


    /**
     * 获取分布式锁，原子操作
     * @param lockKey
     * @param requestId 唯一ID, 可以使用UUID.randomUUID().toString();
     * @param expire
     * @param timeUnit
     * @return
     */
    public boolean tryLock(String lockKey, String requestId, long expire, TimeUnit timeUnit) {
        try{
            RedisCallback<Boolean> callback = (connection) -> {
                return connection.set(lockKey.getBytes(Charset.forName("UTF-8")), requestId.getBytes(Charset.forName("UTF-8")), Expiration.seconds(timeUnit.toSeconds(expire)), RedisStringCommands.SetOption.SET_IF_ABSENT);
            };
            return (Boolean)redisTemplate.execute(callback);
        } catch (Exception e) {
            log.error("redis lock error.", e);
        }
        return false;
    }

    /**
     * 释放锁
     * @param lockKey
     * @param requestId 唯一ID
     * @return
     */
    public boolean releaseLock(String lockKey, String requestId) {
        RedisCallback<Boolean> callback = (connection) -> {
            return connection.eval(UNLOCK_LUA.getBytes(), ReturnType.BOOLEAN ,1, lockKey.getBytes(Charset.forName("UTF-8")), requestId.getBytes(Charset.forName("UTF-8")));
        };
        return (Boolean)redisTemplate.execute(callback);
    }

    /**
     * 获取Redis锁的value值
     * @param lockKey
     * @return
     */
    public String getLock(String lockKey) {
        try {
            RedisCallback<String> callback = (connection) -> {
                return new String(connection.get(lockKey.getBytes()), Charset.forName("UTF-8"));
            };
            return (String)redisTemplate.execute(callback);
        } catch (Exception e) {
            log.error("get redis occurred an exception", e);
        }
        return null;
    }

}
```
RedisCacheClient.class

```

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisConnectionUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Redis处理器
 *
 * @author Arber
 * @version 1.0
 * @date 2019年5月21日 下午4:52:06
 */
@Slf4j
@Component
public class RedisCacheClient {
    private static final int MAX_REPLAY = 3;
    private static final String UPDATE_COLUMN_NAME = "Update";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;



    /**
     * 得到缓存值,直接得到缓存值(不逆序列化),不存在则返回空字符串
     *
     * @param tableName  表名
     * @param columnName 列名
     * @param primary    主健
     * @param clazz      返回结果类
     * @param <T>        泛型
     * @return 缓存值
     */
    public <T> T get(String tableName, String columnName, String primary, Class<? extends T> clazz) {
        Map<Object, Object> values = redisTemplate.opsForHash().entries(createKey(tableName, columnName, primary));
        return values.containsKey(columnName) ? AirJsonUtil.parseObject(values.get(columnName).toString(), clazz) : null;
    }

    /**
     * 解压缩并转换对象
     * 得到缓存值,直接得到缓存值(不逆序列化),不存在则返回空字符串
     *
     * @param tableName
     * @param columnName
     * @param primary
     * @param clazz
     * @return
     */
    public <T> T getUnzip(String tableName, String columnName, String primary, Class<? extends T> clazz) {
        Map<Object, Object> values = redisTemplate.opsForHash().entries(createKey(tableName, columnName, primary));
        if (!values.containsKey(columnName)) {
            return null;
        }
        String value = values.get(columnName).toString();
        //解压缩并转换对象
        return AirJsonUtil.parseObject(AirStringUtil.uncompress(value), clazz);
    }

    /**
     * 得到缓存值,直接得到缓存值(不逆序列化),不存在则返回空字符串
     *
     * @param tableName  表名
     * @param columnName 列名
     * @param primary    主健
     * @return 缓存值
     */
    public String get(String tableName, String columnName, String primary) {
        Map<Object, Object> values = redisTemplate.opsForHash().entries(createKey(tableName, columnName, primary));
        return values.containsKey(columnName) ? values.get(columnName).toString() : null;
    }

    /**
     * 删除键
     *
     * @param tableName  表名
     * @param columnName 列名
     * @param primary    主健
     * @return 缓存值
     */
    public Boolean remove(String tableName, String columnName, String primary) {
        return redisTemplate.delete(createKey(tableName, columnName, primary));
    }

    /**
     * 更新缓存值
     *
     * @param tableName      表名
     * @param columnName     列名
     * @param primary        主健
     * @param value          缓存值
     * @param updateDateTime 更新时间
     * @param expireTime     过期时间
     * @param replay         重试次数
     * @return 更新结果
     */
    public Boolean updateValueMulti(String tableName, String columnName, String primary, String value, Date updateDateTime, Date expireTime,
                                    int replay) {
        if (replay >= MAX_REPLAY) {
            return false;
        }
        String key = createKey(tableName, columnName, primary);
        Map<Object, Object> valuesMap = redisTemplate.opsForHash().entries(key);
        if (valuesMap.containsKey(UPDATE_COLUMN_NAME)) {
            if (Long.parseLong((String) valuesMap.get(UPDATE_COLUMN_NAME)) >= updateDateTime.getTime()) {
                return true;
            }
            redisTemplate.watch(key);
        }
        if (valuesMap.isEmpty()) {
            valuesMap = new HashMap<>();
        }
        valuesMap.put(columnName, value);
        valuesMap.put(UPDATE_COLUMN_NAME, String.valueOf(updateDateTime.getTime()));

        // 增加事务支持(在RedisSentinelConfig里有事务支持配置)
        redisTemplate.setEnableTransactionSupport(true);
        redisTemplate.multi();
        redisTemplate.opsForHash().putAll(key, valuesMap);
        redisTemplate.expireAt(key, expireTime);
        List<Object> rs = redisTemplate.exec();
        RedisConnectionUtils.unbindConnection(redisTemplate.getConnectionFactory());
        if (rs == null) {
            return updateValueMulti(tableName, columnName, primary, value, updateDateTime, expireTime, ++replay);
        }
        return true;
    }

    /**
     * 更新缓存值
     *
     * @param tableName      表名
     * @param columnName     列名
     * @param primary        主健
     * @param value          缓存值
     * @param updateDateTime 更新时间
     * @param expireTime     过期时间
     * @param replay         重试次数
     * @return 更新结果
     */
    @Transactional(rollbackFor = Exception.class)
    public Boolean updateValue(String tableName, String columnName, String primary, String value, Date updateDateTime, Date expireTime, int replay) {

        // 增加事务支持(在RedisSentinelConfig里有事务支持配置)
        redisTemplate.setEnableTransactionSupport(true);
        if (replay >= MAX_REPLAY) {
            return false;
        }
        String key = createKey(tableName, columnName, primary);
        Map<Object, Object> valuesMap = redisTemplate.opsForHash().entries(key);
        if (valuesMap.containsKey(UPDATE_COLUMN_NAME)) {
            if (Long.parseLong((String) valuesMap.get(UPDATE_COLUMN_NAME)) >= updateDateTime.getTime()) {
                return true;
            }
        }
        if (valuesMap.isEmpty()) {
            valuesMap = new HashMap<>();
        }
        valuesMap.put(columnName, value);
        valuesMap.put(UPDATE_COLUMN_NAME, String.valueOf(updateDateTime.getTime()));

        // 更新数据
        redisTemplate.opsForHash().putAll(key, valuesMap);
        return redisTemplate.expireAt(key, expireTime);
    }

    /**
     * 创建Key关键表列关键字
     *
     * @param tableName  表名
     * @param columnName 列名
     * @param primary    主健
     * @return 关键字
     */
    private String createKey(String tableName, String columnName, String primary) {
        return tableName + ":" + primary + ":" + columnName;
    }

    /**
     * 替换方法 setEntryIfNotExists();
     * Only set the key if it does not already exist
     *
     * @param key
     * @param ticketNo NX -- Only set the key if it does not already exist.
     *                 XX -- Only set the key if it already exist
     * @param expx     EX|PX, expire time units, EX=seconds; PX = milliseconds
     * @param time     过期时间
     * @return
     */
    @Deprecated
    public boolean setEntryIfNotExists(String key, String ticketNo, String expx, int time) {

        TimeUnit unit = null;

        switch (expx) {
            case "EX":
                unit = TimeUnit.SECONDS;
                break;
            case "PX":
                unit = TimeUnit.MILLISECONDS;
                break;
            default:
                unit = TimeUnit.SECONDS;
        }

        return redisTemplate.opsForValue().setIfAbsent(key, ticketNo, time, unit);
    }

    /**
     * 通过redis过期时间实现限制QPS
     *
     * @param key      主键
     * @param ticketNo 票号
     * @param time     过期时间
     * @param expx     时间单位 TimeUnit
     * @return
     */
    public boolean setEntryIfNotExists(String key, String ticketNo, int time, TimeUnit expx) {

        return redisTemplate.opsForValue().setIfAbsent(key, ticketNo, time, expx);
    }

    /**
     * 释放redis链接
     */
    public void unbindConnection() {

        RedisConnectionUtils.unbindConnection(redisTemplate.getConnectionFactory());
    }
```

Spring Data JPA为我们提供了下面的Serializer：GenericToStringSerializer、Jackson2JsonRedisSerializer、JacksonJsonRedisSerializer、JdkSerializationRedisSerializer、OxmSerializer、StringRedisSerializer。由于兼容旧的数据本文没有采用（个人比较喜欢下面这个）。[不同的对比  ](https://blog.csdn.net/xiaolyuh123/article/details/78682200)

```
    public RedisTemplate<String, Object> redisTemplate() {
        //创建Json序列化对象
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(Object.class);

        //解决查询缓存转换异常的问题
        ObjectMapper om = new ObjectMapper();
        om.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        om.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);
        jackson2JsonRedisSerializer.setObjectMapper(om);

        // 将默认序列化改为Jackson2JsonRedisSerializer序列化
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        // key序列化
        template.setKeySerializer(jackson2JsonRedisSerializer);
        // value序列化
        template.setValueSerializer(jackson2JsonRedisSerializer);
        // Hash key序列化
        template.setHashKeySerializer(jackson2JsonRedisSerializer);
        // Hash value序列化
        template.setHashValueSerializer(jackson2JsonRedisSerializer);
        template.setConnectionFactory(redisConnectionFactory());
        template.afterPropertiesSet();
        return template;
    }
```

