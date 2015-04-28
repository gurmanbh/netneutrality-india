(function(){
	$.getJSON( "data/data.json", function( data ) {
	console.log(data)
	});
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

	var nn_total_data = 0
	var no_nn_total_data = 0

	var non_netneutral = {scenario_name:'text',
		figure:0,
		min:0,
		max:0,
		desc:'WhatsApp text messages',
		unit:0.001,
		breaks:0,
		maxed_out:'no'
		}

	var scenarios = [

		{scenario_name:'nn-text',
		figure:0,
		min:0,
		max:0,
		desc:'WeChat/Hike/WhatsApp text messages',
		unit:0.001,
		breaks:0,
		maxed_out:'no'
		},

		{scenario_name:'video',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of YouTube/Vimeo video',
		unit:4,
		breaks:0,
		maxed_out:'no'
		},

		{scenario_name:'music',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of Gaana/Saavn music',
		unit:0.65,
		breaks:0,
		maxed_out:'no'
		},

		{scenario_name:'email',
		figure:0,
		min:0,
		max:0,
		desc:'text emails',
		unit:0.01,
		breaks:0,
		maxed_out:'no'
		},

		// {scenario_name:'video-call',
		// figure:0,
		// min:0,
		// max:0,
		// desc:'minutes of video calling',
		// unit:8,
		// breaks:0,
		// maxed_out:'no'
		// },
		
		{scenario_name:'navigation',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of navigation',
		unit:2.5,
		breaks:0,
		maxed_out:'no'
		}

	]



	// define the cool filtering functions here

	function getmydata(plans){
	var result = _.filter(plans, function(plan){
    		return plan.operatorkey === getoperator() && plan.statekey === getcircle();
    	});
	return(result);
	}

	function getInternet(plans){
		var result = _.filter(plans, function(plan){
    		return plan.type==='Internet';
    	});
	return(result);
	}

	function getWA(plans){
		var result = _.filter(plans, function(plan){
    		return plan.type==='WA';
    	});
	return(result);
	}

	// define the cooler math function that defines useful data here

	function somemath(obj){
		var mean = d3.mean(obj,function(d) {return d.dataperday_beingused});
		var useful_data = mean * number_of_days;
		return useful_data;
	}

	function impmath(){
		scenarios.forEach(function(scene){
			scene.max = nn_total_data/scene.unit;
			scene.breaks = scene.max/8;
		})
	}

	// define helper functions here
	var helper_functions = {
		cleanlabel: function(unclean){
			return unclean.toLowerCase().replace(/ /g,'_').replace( /\//g ,'_');
		},
		addComma: function(value){

			return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		},

		rndnumber: function(value){
			return value | 0
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

		// active states for button here

		$('.sc-button').on('click', function(){
			if ($(this).hasClass('active')){
				$(this).removeClass('active');
			}
			else{
				$(this).addClass('active');
			}
		})

		// things that happen after the submit button is clicked
		
		$('#submit-button').on('click',function(){
			$('#yes-nn .scenario-box').html('')
			$('#content').addClass('show');

			console.log('this is scenario length'+scenarios.length)

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
			var indata = getInternet(gotdata);
			nn_total_data = somemath(gotdata);
			var wadata = getWA(gotdata);
			no_nn_total_data = somemath (wadata);
			console.log(nn_total_data, ' ', wadata);
			impmath();

			//bake out scenarios here

			scenarios.forEach(function(scene){
				_.extend(scene, helper_functions);
				$('#yes-nn .scenario-box').append(scenario_TF(scene));
				$("#slider-"+scene.scenario_name).slider({value:scene.figure, min: scene.min, max: scene.max, step: scene.breaks, slide: function( event, ui ){
					var round = helper_functions.rndnumber(ui.value);
	       	 	$("#"+scene.scenario_name+" .figure").html(helper_functions.addComma(round));
	       	 	// console.log(ui);
	       	 		}
	    		});
			});

			// non-neutral math here

			non_netneutral.max = no_nn_total_data/non_netneutral.unit;
			non_netneutral.breaks = non_netneutral.max/8
			console.log(non_netneutral)
		
			$( "#slider1" ).slider({value:0, min: 0, max: non_netneutral.max, step: non_netneutral.breaks , slide: function( event, ui ) {
				var round = helper_functions.rndnumber(ui.value);
	       	 	$( "#sc-1 .figure" ).html(helper_functions.addComma(round));}
	    	});
			
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