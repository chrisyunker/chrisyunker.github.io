function CYTable(options) {

	var context = options.context;
	var pageLength = options.pageLength;
	var url = options.url;
	var title = options.title;
	var errorPanel = options.errorPanel;
	
	var pageStartIndex = 1;
	var pageEndIndex;
	var endIndex;
	var prevEnabled = false;
	var nextEnabled = false;
	
	var prevButton = '<a href="#" onclick="pubTable.prev()"><img id="screenLeft" src="' + context + '/img/left.png" /></a>';
	var nextButton = '<a href="#" onclick="pubTable.next()"><img id="screenRight" src="' + context + '/img/right.png" /></a>';

	function renderTable(data) {
		endIndex = data.length;
		pageEndIndex = pageStartIndex + data.photos.length - 1;
		prevEnabled = (pageStartIndex > 1) ? true : false;
		nextEnabled = (endIndex > pageEndIndex) ? true : false;

		var prev = prevEnabled ? prevButton : '&nbsp;';
		var next = nextEnabled ? nextButton : '&nbsp;';
		var range = pageStartIndex + ' - ' + pageEndIndex + '  [' + endIndex + ']';
		
		$('#pub-left').html(prev);
		$('#pub-index').html(range);
		$('#pub-right').html(next);
		$('#pub-table').html('<tr></tr>');

		$.each(data.photos, function () {
				  
			$('#pub-table tr:last').clone(true).insertAfter('#pub-table tr:last');
		    $('#pub-table tr:last').html(
		    	'<td><a href="' + this.flickr_url + '" target="_blank"><img src="' +
		    	context + '/img/projects/published/' + this.file_name + '"/></a></td>' +
		    	'<td>' + this.photo_name + '</td>' +
		    	'<td><a href="' + this.pub_url + '" target="_blank">' + this.pub_name + '</a></td>');
		});
		  
	}
	
	function failCallback(XMLHttpRequest, textStatus, errorThrown) {
	    errorPanel(errorThrown);
	}
	
	function turnPage() {
		$.ajax({
			url: context + url,
			type: 'POST',
			data: {
				request: 'Published',
				start: pageStartIndex,
				end: pageEndIndex
			},
			dataType: 'json',
			success: function (data, textStatus, XMLHttpRequest) {
			    if (data.status !== 1) {
				    errorPanel(data.message);
			    } else {
				    renderTable(data.data);
			    }
			},
			fail: failCallback
		});
	}
	
	this.next = function () {
		pageStartIndex = pageEndIndex + 1;
		pageEndIndex = pageStartIndex + pageLength - 1;
		turnPage();
	};
	
	this.prev = function () {
		pageEndIndex = pageStartIndex - 1;		
		pageStartIndex = pageEndIndex - pageLength + 1;
		turnPage();
	};
	
	this.first = function () {
		pageStartIndex = 1;
		pageEndIndex = pageStartIndex + pageLength - 1;
		turnPage();
	};
	
}

function CYDialog(context, title, message) {
	
	function resize() {
		var width = $('#cy-dialog table').outerWidth();
		var height = $('#cy-dialog table').outerHeight();
		$('#cy-dialog').dialog('option', 'width', (width + 50));
		$('#cy-dialog').dialog('option', 'height', (height + 50));
	}

	$('body').append(
		'<div id="cy-dialog">' +
		'<table>' +
		'<tr>' +
		'<td><img src="' + context + '/img/waiting.gif" alt="Loading"/></td>' +
		'<td><h1>' + message + '</h1></td>' +
		'</tr>' +
		'</div>');

	$('#cy-dialog').dialog({
		title: title,
		autoOpen: false,
		draggable: false,
		resizable: false,
		modal: true
	});

	$('#cy-dialog').dialog('open');
	resize();

	this.close = function () {
		$('#cy-dialog').dialog('close');		
	};

}

function CYClearPanel() {
	$('#www-loading').remove();
}

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
