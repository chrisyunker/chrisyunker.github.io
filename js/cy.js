function CYScreenshot(context, screenArray, screenId, width, height) {
  width = width || 320;
  height = height || 460;
  var index = 0;
  var length = screenArray.length;

  function displayScreen(index) {
    $('#screenImage').attr('src', screenArray[index]);
    $('#screenTitle').html('Screenshot ' + (index + 1) + '/' + length);
  }
  function left() {
    index--;
    if (index < 0) { 
      index = screenArray.length - 1;
    }
      displayScreen(index);
  }
  function right() {
    index++;
      if (index > screenArray.length - 1) {
        index = 0;
      }
      displayScreen(index);
  }

  $('#' + screenId).html(
    '<table class="screenshot">' +
    '<tr>' +
    '<td><img id="screenLeft" src="' + context + '/img/left.png" /></td>' +
    '<td><div id="screenTitle"></div></td>' +
    '<td><img id="screenRight" src="' + context + '/img/right.png" /></td>' +
    '</tr>' +
    '<tr>' +
    '<td colspan="3"><img id="screenImage" height="'+ height +'" width="'+ width +'" /></td>' +    
    '</tr>' +
    '</table>');

  $('#screenLeft').click(function () {
    left();
  });
  $('#screenRight').click(function () {
    right();
  });

  displayScreen(0);
}
