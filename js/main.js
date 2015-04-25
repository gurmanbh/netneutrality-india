(function(){
	// define templates here
	var telecomlist_Html = $('#selector-template').html();
	var telecomList_TF = _.template(telecomlist_Html);

	var budgetlist_Html = $('#budget-selector-template').html();
	var budgetList_TF = _.template(budgetlist_Html);

	var helper_functions = {
		cleanlabel: function(unclean){
			return unclean.toLowerCase().replace(/ /g,'_').replace( /\//g ,'_');
		}
	};

	var budgetlist = [10,30,50,80,100,150,200,300,350,400,500];
	var budget_objs = _.map(budgetlist, function(budget){ return {'budget': budget} });

	// read the data in

	d3.csv('data/internet-state.csv',function(error, plans){
		
		// Create list of uniquetelecom circles for the drop down

		var state_list = _.chain(plans)
							.pluck('state')
							.uniq()
							.sort()
							.value();

		// append the list to the DOM

		var state_objs = _.map(state_list, function(stateobj){ return {'state': stateobj} });


		state_objs.forEach(function(state){
			_.extend(state, helper_functions);
			$('#telecom-selector').append(telecomList_TF(state));
		});

		// append budgets to the DOM

		budget_objs.forEach(function(budget){
			$('#budget-selector').append(budgetList_TF(budget));
		});

		// active button for telcos

		$('.provider').on('click',function(){
			$('.provider').removeClass('active');
			$(this).addClass('active');
			var whichprovider = $(this).attr('data-which')
			$('#provider-box').attr('data-selected-provider', whichprovider)
		});
		
		$('#submit-button').on('click',function(){
			var selected_circle = $('#telecom-selector').val();
			var selected_budget = $('#budget-selector').val();
			var selected_operator = $('#provider-box').attr('data-selected-provider')

			console.log(selected_circle,selected_budget,selected_operator);

			$('#telecom-map').attr('data-selected-circle', selected_circle);

		});

		$( "#slider1" ).slider({value:100, min: 0, max: 10000, step: 3000, slide: function( event, ui ) {
       	 	$( "#sc-1 .figure" ).html(ui.value);}
    	});

    	$('.state_group').on('click',function(){
    		var selected_circle = $(this).attr('id');
    		console.log(selected_circle);
			$('#telecom-selector').val(selected_circle);
			$('#telecom-map').attr('data-selected-circle', selected_circle);
		});

		$("#telecom-selector").change(function(event) {
			var selected_circle = $('#telecom-selector').val();
			$('#telecom-map').attr('data-selected-circle', selected_circle);
		});

	});

}).call(this)