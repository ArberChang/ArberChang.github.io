---
title: CentOs7  安装Docker 并配置代理访问外网
date: 2019-05-11 19:58:39
categories: [技术,后端,服务器] 
tags: [Docker,linxu]
description: Docker 在没用的时候觉得就是个虚拟机而已，真正用起来发现，这东西真香！
             喜欢的的不得了，文章总结了一些基于COS7的安装过程。


---


> Linux version 3.10.0-693.el7.x86_64 
> docker为最新的即可

### 一 配置yum代理

```conf
vim  /etc/yum.conf
```

```
proxy=http://172.20.36.11:80
```

### 二 修改yum源为阿里源
#### 进入yum源配置文件夹。（配置之前先看看有没有安装wget命令呢，没的话可以先用当前的yum源安装一下再说。yum -y install wget）
```conf
cd /etc/yum.repos.d
```
#### 备份一下之前的配置文件。
```conf
mv ./CentOS-Base.repo ./CentOS-Base.repo.bak
```
#### 下载阿里源或者163源
```conf
wget http://mirrors.aliyun.com/repo/Centos-7.repo
wget http://mirrors.163.com/.help/CentOS7-Base-163.repo
```

#### 移动到源默认位置
```conf
mv CentOS7-Base-163.repo /etc/yum.repos.d/CentOS-Base.repo
mv Centos-7.repo /etc/yum.repos.d/CentOS-Base.repo
```

#### 运行yum clean all , yum makecache生成缓存即可，之后便可以使用yum安装软件了。
```conf
yum clean all
yum makecache
```

### 三 docker 安装报错 container-selinux >= 2.9 解决
#### 阿里云上的epel源
```conf
yum -y  install epel-release
```

#### 安装 container-selinux
```conf
yum -y install container-selinux
```

### 四 安装docker
#### 安装docker服务
```conf
yum -y install docker-ce
```
#### 配置docker源
```conf
vim /etc/docker/deamon.json
```

```
{
    "registry-mirrors": [ "https://registry.docker-cn.com"],
    "insecure-registries": [ "172.19.69.2:5000","172.22.0.35:5000"]
}
```

#### 配置docker http代理
```conf
mkdir -p /etc/systemd/system/docker.service.d
vim /etc/systemd/system/docker.service.d/http-proxy.conf
```
```
[Service]
 Environment="HTTP_PROXY=http://username:password@126.15.15.1:8888"
```

#### 刷新源并重启
```conf
systemctl daemon-reload
systemctl restart docker 
systemctl show --property=Environment docker
```

#### 设置docker开启自动启动
```conf
sudo systemctl enable docker
sudo systemctl start docker
```


