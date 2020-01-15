---
title: Oracle游标测试
date: 2019-10-11 19:20:35
categories: [技术,后端,数据库]
tags: [Oracle]
description:   生产中经常要用到 将从表插入一些数据,但是手动插入数量较为巨大.因而循环及判断语句在oracle匿名代码块中起到了很大的作用！
 
---


#### 1、创建测试表

```sql

create table a_test1
     (
     	column_1 int not null
     		constraint a_test2_pk
     			primary key,
     	column_2 varchar2(12)
     )

create table a_test2
     (
     	column_1 int not null
     		constraint a_test2_pk
     			primary key,
     	column_2 varchar2(12)
     )

CREATE SEQUENCE seq_a_test
            INCREMENT BY 1  -- 每次加几个
            START WITH 1399       -- 从1开始计数
            NOMAXVALUE        -- 不设置最大值
            NOCYCLE               -- 一直累加，不循环
            CACHE 10;
```
#### 2、循环插入
```sql

--普通循环插入
begin
    for a in 1 .. 100
        loop
            insert into A_TEST1(column_1, column_2) values (seq_a_test.nextval,'aaa');
        end loop;
    commit ;
end;

select * from a_test1;

```



```sql

--cursor 循环插入
declare
    cursor cursor_id is select COLUMN_1 from a_test1 order by COLUMN_1 desc ;
    cid cursor_id%rowtype;
begin
    open cursor_id;
    loop
        fetch cursor_id into cid;
        Exit when cursor_id%notfound;
        if cid.COLUMN_1 <> 1400 then
            insert into A_TEST2(column_1, column_2) values (cid.COLUMN_1+1000,'aaa');
        end if;
    end loop;
    EXCEPTION
        when others then
        close cursor_id;
    if cursor_id%isopen then
        close cursor_id;
    end if;
    commit;
end;
```
#### 3、删除数据
```sql
drop table a_test1;
drop table a_test2;
drop sequence seq_a_test;
```
