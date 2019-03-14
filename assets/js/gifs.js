var getGif = function() {
    var gif = [];
    $('img').each(function() {
      var data = $(this).data('alt');
      if (data) {
        gif.push(data);
      }
    });
    return gif;
  }
var gif = getGif();
var image = [];
 
$.each(gif, function(index) {
  image[index]     = new Image();
  image[index].src = gif[index];
});
$('figure').on('click', function() {
 
  var $this   = $(this),
          $img    = $this.children('img'),
          $imgAlt = $img.attr('data-alt');
           
    $img.attr('src', $imgAlt);
});
