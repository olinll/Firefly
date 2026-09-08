---
title: 使用CloudFlare优选任何网站！
slug: cf-fastip
published: 2026-06-13 19:54:38
updated: 2026-06-21 16:57:55
description: 通过 Worker 反代为网站做 IP 分流优选，提高国内访问速度与可用性
image: https://img.olinl.com/file/post-img/cf-fastip/0001.webp
category: 站点与部署
tags:
  - Cloudflare
draft: false
comment: false
---

优选前：
![优选前 ITDOG IP数量](https://img.olinl.com/file/post-img/cf-fastip/0002.webp)
优选后：
![优选后 ITDOG IP数量](https://img.olinl.com/file/post-img/cf-fastip/0001.webp)

## 优选原理

简单说，Cloudflare 的小黄云会同时托管两件事——DNS 解析层和路由规则层；只要开启小黄云，你就没法单独改解析、指向更快的节点。而 Worker 路由的出现，让规则层和解析层都可以自己配置，这就是优选能落地的关键。

> [!NOTE] [原文：#优选原理 - 二叉树树](https://2x.nz/posts/cf-fastip/#优选原理)
> 首先我们要知道 CDN 如何为不同域名分发不同内容。
> 
> 可以将其抽象为两层：**规则层**和**解析层**。当我们普通地在 Cloudflare 添加一条开启了小黄云的解析，Cloudflare 会为我们做两件事：
> 
> - 写一条 DNS 解析指向 Cloudflare
> - 在 Cloudflare 创建一条路由规则
> 
> 如果想要优选，实际上就是手动更改这条 DNS 解析，使其指向一个更快的 Cloudflare 节点。但一旦关闭小黄云，路由规则也会被删除，再访问就会变成 DNS 直接指向 IP——也就用不了了。
> 
> **而 Worker 路由让自定义成为可能。**
> 
> 创建 Worker 路由规则（规则层）后，DNS 解析（解析层）就可以任意指向优选节点。这两件事都可以自己来做，不再依赖小黄云。
> 
> 这就是经由 Worker 路由的流量能做优选的原因。

## 选择优选域名

优选的核心就是选择一个国内访问速度更快的Cloudflare节点IP或域名。

常用的社区优选域名：[https://cf.090227.xyz](https://cf.090227.xyz)

这些优选域名通常是通过扫描Cloudflare官方IP段，找出国内延迟最低的IP整理而成。

### 使用优选域名

直接使用 [https://cf.090227.xyz](https://cf.090227.xyz)，官方推荐优先使用自定义前缀的泛域名，例如 `123.cf.090227.xyz`。

随后在你的域名 DNS 记录里添加一条 CNAME 记录，**不要开启小黄云**。

![添加CNAME记录](https://img.olinl.com/file/post-img/cf-fastip/0003.webp)

之后想给其他站点也用这个优选，把站点 CNAME 解析到上面配置好的 `123.cf.090227.xyz` 即可。

## 各类优选方案

### Page/Worker 项目优选

如果你需要优选 Page/Worker 项目，首先，如果你的项目是 Pages，需要先在 Pages 项目设置里迁移到 Workers。

接下来配置 Worker 路由：选择你的域名，路由模式填写 `你的域名/*`（例如 `cf-blog.7o.nz/*`）。

![配置Worker路由](https://img.olinl.com/file/post-img/cf-fastip/0004.webp)

最后写一条 DNS 解析到上面配置的优选域名即可。

![配置域名优选](https://img.olinl.com/file/post-img/cf-fastip/0005.webp)

### Worker 路由反代全球并优选

> 本方法的原理是通过 Worker 反代源站，然后对 Worker 的入口节点做优选。这不是传统意义上的优选——源站收到的 Host 头仍是源站域名，所以源站不需要为优选域名额外配置 SSL/路由。

> 本方案可以优选Vercel，只需要将Vercel提供的域名填写进下面的配置即可。

点击计算 --> Wokers 和 Pages 创建应用程序 --> 从Hello Word!开始 --> 修改Worker name --> 点击部署 --> 右上角点击编辑代码，将下面代码粘贴进去，随后点击部署。

详情见下图：

![创建CloudFlare Worker 并修改代码](https://img.olinl.com/file/post-img/cf-fastip/0006.webp)

```javascript

// 域名前缀映射配置
// 示例：'cf-blog.7o.nz': 'cf-blog.'
// 则 Worker 路由 cf-blog.* 都会反代到 cf-blog.7o.nz
const domain_mappings = {
  '源站.com': '最终访问头.',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const current_host = url.host;

  // 强制使用 HTTPS
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    return Response.redirect(url.href, 301);
  }

  const host_prefix = getProxyPrefix(current_host);
  if (!host_prefix) {
    return new Response('Proxy prefix not matched', { status: 404 });
  }

  // 查找对应目标域名
  let target_host = null;
  for (const [origin_domain, prefix] of Object.entries(domain_mappings)) {
    if (host_prefix === prefix) {
      target_host = origin_domain;
      break;
    }
  }

  if (!target_host) {
    return new Response('No matching target host for prefix', { status: 404 });
  }

  // 构造目标 URL
  const new_url = new URL(request.url);
  new_url.protocol = 'https:';
  new_url.host = target_host;

  // 创建新请求
  const new_headers = new Headers(request.headers);
  new_headers.set('Host', target_host);
  new_headers.set('Referer', new_url.href);

  try {
    const response = await fetch(new_url.href, {
      method: request.method,
      headers: new_headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'manual'
    });

    // 复制响应头并添加CORS
    const response_headers = new Headers(response.headers);
    response_headers.set('access-control-allow-origin', '*');
    response_headers.set('access-control-allow-credentials', 'true');
    response_headers.set('cache-control', 'public, max-age=600');
    response_headers.delete('content-security-policy');
    response_headers.delete('content-security-policy-report-only');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response_headers
    });
  } catch (err) {
    return new Response(`Proxy Error: ${err.message}`, { status: 502 });
  }
}

function getProxyPrefix(hostname) {
  for (const prefix of Object.values(domain_mappings)) {
    if (hostname.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

```


随后参考 [Page/Worker 项目优选](#pageworker-项目优选) 进行配置即可

### SaaS 外域优选

我们可以通过SaaS 自定义主机名的功能，将不属于Cloudflare的域名cname到自己的域名进行管理。  
原理：我们将域名cname到Cloudflare边缘节点之后，Cloudflare会去寻找路由或者自定义主机名，如果寻找到了，就并入所属的配置，如果没有找到就1000。

这里演示Worker 绑定外部域名的路由，进行优选

1. 首先添加一个路由，域名选择你cf的域名，路由填写你的外域域名+/*

![添加外域路由](https://img.olinl.com/file/post-img/cf-fastip/0007.webp)

2. 然后我们到cf域名所属的`SSL/TLS` `自定义主机名`  
添加一个回退源，这个回退源一定要开启小黄云的才可以！

3. 添加一个自定义主机名记录

- 自定义主机名填写外域地址
- 证书验证方法填写HTTP验证（你已经将域名CNAME到的Cloudflare 他会自动生成http校验去帮助你完成SSL验证）

4. 我们将外域的域名 CNAME到你的Cloudflare 优选域名去，也就是下图这样

![外域域名CNAME到cf cdn域名去](https://img.olinl.com/file/post-img/cf-fastip/0008.webp)

PS：此方法同样适用于子域

### CloudFlare Tunnel优选

`我们需要开启自定义主机名SaaS功能！`详见：[SaaS 外域优选](#saas-外域优选)

1. 我们先配置2个Tunnel，指向同一个服务，一个是作为SaaS 源服务器使用，一个是最终访问优选过的站点。如下图：

![创建Tunnel](https://img.olinl.com/file/post-img/cf-fastip/0009.webp)

上图中 `1.oi.cd` 作为SaaS源服务器使用，`2.oi.cd` 作为优选过的站点。

2. 我们先将`2.oi.cd` 这个DNS记录删掉，注意！！ 这是需要到DNS记录里面删除，不要删除Tunnel！  
然后我们添加一条`2.oi.cd`的优选解析，最终如下图

![配置优选域名](https://img.olinl.com/file/post-img/cf-fastip/0010.webp)

3. 下面我们点击到 SSL/TLS -> 自定义主机名（如果没有配置回退源，需要配置一个开启了小黄云的域名，再进行下面的操作）
添加一条自定义主机名配置

- 自定义主机名：最终访问的站点，经过优选的 `2.oi.cd`
- 证书验证方法：HTTP验证 （因为域名在Cloudflare 他会自己验证，我们不需要进行任何解析）
- 自定义源服务器：填写解析记录没有动过的Tunnel，也就是`1.oi.cd`

保存后如下：

![](https://img.olinl.com/file/post-img/cf-fastip/0011.webp)

4. 随后我们访问2.oi.cd即可实现优选。


## 最后

CloudFlare 的优选方案还有很多，外域优选、CloudFlare Tunnel 优选、CloudFlare R2 优选等，请点击[这里](https://2x.nz/posts/cf-fastip/#各类优选方案)查看更多。

- 图文：[试试 Cloudflare IP 优选！让 Cloudflare 在国内再也不是减速器！ - 二叉树树](https://2x.nz/posts/cf-fastip/)
- 视频：[全网最全 CF 优选全解（B 站）](https://www.bilibili.com/video/BV1QpSoBqERj)
