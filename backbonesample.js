(function(){
 
	var state_object = {
		status: 'stable',
		page: 2
	};
 
	_.extend(state_object, Backbone.Events);
 
	state_object.on('change:page', function(e){
		console.log('object has changed');
	});
 
	d3.select('#canvas').on('click', function(){
		state_object.page = 5;
		state_object.trigger('change:page');
 
		var page_number = (state_model_instance.get('page') || 0) + 5
		state_model_instance.set('page', page_number);
 
		console.log(state_model_instance.get('page'))
	})
 
 
	var State_Model = Backbone.Model.extend({});
	var state_model_instance = new State_Model;
 
 
	state_model_instance.on('change', function(){
		console.log('state model has changed')
	});
 
	state_object.trigger('change')
 
}).call(this)