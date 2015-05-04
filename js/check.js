        });

        var sliders = $('.valueslider');

        // this gives parameters to the sliders

        sliders.each(function(i) {
          var $slider = $(this);

          $slider.slider 

(function(){
  var sliders = $('.slider');
  var max = 200,
  step_size = 20;

  sliders.each(function(i) {
  var $slider = $(this);
  var $input = $('#slider-' + $slider.attr('data-which') + '-out');
  
    $slider.slider({
    
    value: 0,
    min: 0,
    max: max,
    step: step_size,
    slide: function( event, ui ) {
      
      console.log('sliding');

      $(this).attr('data-value', ui.value);

      var total = getCombinedValues();
      var which = $(this).attr('data-which');
      if (total > max) {
          return false;
      }
       print(which, ui.value);
    },
      
    start: function(e, ui){

      var total = getCombinedValues();
      var which = $(this).attr('data-which');
      if (total > max){
          $(this).slider('value', ui.value - step_size);
          $(this).attr('data-value', ui.value - step_size);
          print(which, ui.value - step_size);
      }
      }
  });
});

function print(which, val){
    $('#slider-'+which+'-out').html(val);
}

function getCombinedValues(){
  var total = 0;
  $('.slider').each(function(){
    total += +$(this).attr('data-value') || 0;
  });
  console.log(total);
  return total;
}

}).call(this)