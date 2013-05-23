---
layout: project
title: Y-Tiles
---
<script>
var screenArray = [
  '/img/ytiles/screenshot1.png',
  '/img/ytiles/screenshot2.png',
  '/img/ytiles/screenshot3.png'];
$(document).ready(function() {
  CYScreenshot('', screenArray, 'appScreen', 320, 460);
});
</script>
<div id="ios">
  <table>
    <tbody><tr>
      <td><div id="appScreen"></div></td>
      <td>
      <p>
      Y-Tiles is an iPhone version of the classic handheld Fifteen Puzzle
      tile game. The tiles can be either a numbered grid or an iPhone
      photo.
      </p>
      <div>
      <a href="http://itunes.apple.com/us/app/y-tiles/id307222601">
        <img alt="itunes logo" src="/img/app_store.jpg" style="vertical-align: middle;" />
      </a>
      <br />
      <br />
      <a href="http://github.com/chrisyunker/y-tiles">
        <img alt="github logo" src="/img/github.png" width="30" height="30" style="vertical-align: middle; width: 30px; height: 30px;" />
      </a>
      <b>Source code</b>
      </div>
      </td>
    </tr>
  </tbody></table>
</div>
