---
layout: default
title: Chris Yunker's Weblog
---

## Posts

<div id="home">
  <ul class="posts">
    {% for post in site.posts %}
    <li><span>{{ post.date | date: "%Y %b %d" }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
    {% endfor %}
  </ul>
</div>
