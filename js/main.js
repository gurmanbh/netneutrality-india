(function(){
	// define templates here
	var telecomlist_Html = $('#selector-template').html();
	var telecomList_TF = _.template(telecomlist_Html);

	var budgetlist_Html = $('#budget-selector-template').html();
	var budgetList_TF = _.template(budgetlist_Html);

	var scenario_Html = $('#scenario-template').html();
	var scenario_TF = _.template(scenario_Html);

	// define some cool numbers here

	var number_of_days = 7;

	// cool functions that we use again and again

	function getbudget(){
		return $('#budget-selector').val();
	}

	function getoperator(){
		return $('#provider-box').attr('data-selected-provider');
	}

	function getcircle(){
		return $('#telecom-selector').val();
	}

	// define the scenarios

	var scenarios = [

		{scenario_name:'nn-text',
		figure:100000,
		min:0,
		max:500000,
		desc:'WeChat/Hike/WhatsApp messages',
		unit:0.001,
		breaks:5000,
		maxed_out:'no'
		},

		{scenario_name:'video',
		figure:0,
		min:0,
		max:5000,
		desc:'hours of YouTube/Vimeo video',
		unit:2,
		breaks:500,
		maxed_out:'no'
		},

		{scenario_name:'music',
		figure:0,
		min:0,
		max:5200,
		desc:'hours of Gaana/Saavn music',
		unit:2,
		breaks:220,
		maxed_out:'no'
		},

		{scenario_name:'email',
		figure:0,
		min:0,
		max:5000,
		desc:'text emails',
		unit:2,
		breaks:500,
		maxed_out:'no'
		}
		

	]

	// define the cool filtering function here

	function getmydata(plans){
	var result = _.filter(plans, function(plan){
    		return plan.operatorkey === getoperator() && plan.statekey === getcircle();
    	});
	return(result);
	}

	// define the cooler math function that defines useful data here

	function somemath(obj){
		var mean = d3.mean(obj,function(d) {return d.dataperday_beingused});
		var useful_data = mean * number_of_days;
		return useful_data;
	}

	// define helper functions here
	var helper_functions = {
		cleanlabel: function(unclean){
			return unclean.toLowerCase().replace(/ /g,'_').replace( /\//g ,'_');
		},
		addComma: function(value){
			return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
	};

	// define budget list here
	var budgetlist = [5,10,20,25,50,75,100,150,200];
	var budget_objs = _.map(budgetlist, function(budget){ return {'budget': budget} });

	// read the data in

	d3.csv('data/internet-state.csv',function(error, plans){
		
		// Create list of unique telecom circles for the drop down

		var state_list = _.chain(plans)
							.pluck('state')
							.uniq()
							.sort()
							.value();

		// append the list to the DOM

		var state_objs = _.map(state_list, function(stateobj){return {'state': stateobj} });


		state_objs.forEach(function(state){
			_.extend(state, helper_functions);
			$('#telecom-selector').append(telecomList_TF(state));
		});

		// append budgets to the DOM

		budget_objs.forEach(function(budget){
			$('#budget-selector').append(budgetList_TF(budget));
		});

		// make name keys pretty and operator names lowercase
		plans.forEach(function(plan){
			plan.statekey = helper_functions.cleanlabel(plan.state);
			plan.operatorkey = helper_functions.cleanlabel(plan.operator);
		});

		// active button for telcos

		$('.provider').on('click',function(){
			$('.provider').removeClass('active');
			$(this).addClass('active');
			var whichprovider = $(this).attr('data-which')
			$('#provider-box').attr('data-selected-provider', whichprovider)
		});
		
		$('#submit-button').on('click',function(){

			// calculate costs
			plans.forEach(function(plan){
				plan.dataperday_beingused = plan.dataperdayperrupee * getbudget();
			});

			var selected_circle = getcircle();
			var selected_budget = getbudget();
			var selected_operator = getoperator();
			// console.log(selected_circle,selected_budget,selected_operator);
			$('#telecom-map').attr('data-selected-circle', selected_circle);
			var gotdata = getmydata(plans);
			var useful_numbers = somemath(gotdata)
			console.log(useful_numbers);

			
		});

		//bake out scenarios here

		scenarios.forEach(function(scene){
			_.extend(scene, helper_functions);
			$('#yes-nn .scenario-box').append(scenario_TF(scene));
			$("#slider-"+scene.scenario_name).slider({value:scene.figure, min: scene.min, max: scene.max, step: scene.breaks, slide: function( event, ui ){
       	 	$("#"+scene.scenario_name+" .figure").html(helper_functions.addComma(ui.value));
       	 	// console.log(ui);
       	 }
    	});
		});

		$( "#slider1" ).slider({value:100, min: 0, max: 10000, step: 3000, slide: function( event, ui ) {
       	 	$( "#sc-1 .figure" ).html(helper_functions.addComma(ui.value));}
    	});

    	// this updates the selector value when the user clicks on a certain state on the map

    	$('.state_group').on('click',function(){
    		var selected_circle = $(this).attr('id');
			$('#telecom-selector').val(selected_circle);
			$('#telecom-map').attr('data-selected-circle', selected_circle);
		});

		// this updates the map colors when the user selects a state

		$("#telecom-selector").change(function(event) {
			var selected_circle = $('#telecom-selector').val();
			$('#telecom-map').attr('data-selected-circle', selected_circle);
		});

	});

}).call(this)