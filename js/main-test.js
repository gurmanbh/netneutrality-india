(function(){

	// define templates here

	var telecomlist_Html = $('#selector-template').html();
	var telecomList_TF = _.template(telecomlist_Html);

	var budgetlist_Html = $('#budget-selector-template').html();
	var budgetList_TF = _.template(budgetlist_Html);

	var scenario_Html = $('#scenario-template').html();
	var scenario_TF = _.template(scenario_Html);

	var nn_buttons_Html = $('#nn-button-template').html();
	var nn_buttons_TF = _.template(nn_buttons_Html);

	// keeps track of the items submitted via the menu

	var menu_status = {
		provider: "null",
		budget:"null",
		circle: "null"
	}

	// keeps track of the slider status. 

	var slider_totals = {

		yes_nn:{total: 0,
			used:0,
			left:0,
			percentage_used:0,
			percentage_left:0
		},

		no_nn:{total: 0,
			used:0,
			left:0,
			percentage_used:0,
			percentage_left:0
		}
	}

	// checks for missing data via the menu submission. Is called when the user clicks on submit. If there is missing data, an error is thrown.

	function missingdata(){
		if (menu_status.provider === "null" || menu_status.budget=== "null" || menu_status.circle === "null"){
			return true
		}
	}

	// active button for telcos

	$('.provider').on('click',function(){
		$('.provider').removeClass('active');
		$(this).addClass('active');
		var whichprovider = $(this).attr('data-which')
		$('#provider-box').attr('data-selected-provider', whichprovider)
	});

	// active states for fb/wa buttons here

	$('.sc-button').on('click', function(){
		if ($(this).hasClass('active')){
			$(this).removeClass('active');
		}
		else{
			$(this).addClass('active');
		}
	})

	// define some cool numbers here

	var number_of_days = 7;
	var number_of_breaks = 8;

	// imp functions that we use again and again

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
		maxed_out:'no',
		data_used:0
		},

		{scenario_name:'video',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of YouTube/Vimeo video',
		unit:4,
		breaks:0,
		maxed_out:'no',
		data_used:0
		},

		{scenario_name:'music',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of Gaana/Saavn music',
		unit:0.65,
		breaks:0,
		maxed_out:'no',
		data_used:0
		},

		{scenario_name:'email',
		figure:0,
		min:0,
		max:0,
		desc:'text emails',
		unit:0.01,
		breaks:0,
		maxed_out:'no',
		data_used:0
		},
		
		{scenario_name:'navigation',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of navigation',
		unit:2.5,
		breaks:0,
		maxed_out:'no',
		data_used:0
		}

	];


	// define the cool filtering functions here

	// getmydata filters on the basis of state and provider

	function getmydata(plans){
		var result = _.filter(plans, function(plan){
	    		return plan.operatorkey === menu_status.provider && plan.statekey === menu_status.circle;
	    	});
		return(result);
	}

	// getInternet returns net neutral plans

	function getInternet(plans){
		var result = _.filter(plans, function(plan){
    		return (plan.internet>0 && (plan.facebook==='unlimited' || plan.twitter==='unlimited' || plan.whatsapp==='unlimited')) || (type = 'Internet');
    	})
		return(result);
	}
	
	// getNonNN returns non net neutral plans. It uses underscore's _.some function to check if our type list has anything in common with the checklist defined below.

	function getNonNN(plans){
		var checklist = ['Unlimited-WA','Unlimited-FB','Unlimited-TW','FB','TW','WA'];
		var result = _.some(checklist, function(obj){
        		return _.contains(plans.typelist, obj)
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
			scene.max = slider_totals.yes_nn.total/scene.unit;
			scene.breaks = scene.max/number_of_breaks;
			// console.log(scene);
		});
	}

	// function to calculate total used data

	function calculateuseddata() {
		slider_totals.yes_nn.total = d3.sum(scenarios, function(d) { return d.data_used; });
		console.log(slider_totals.yes_nn.total)
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

	$.getJSON( "data/data.json", function(plans) {
		
		// Create list of unique telecom circles for the drop down

		var state_list = _.chain(plans)
							.pluck('state')
							.uniq()
							.sort()
							.value();

		// append the list to the DOM

		var state_objs = _.map(state_list, function(stateobj){
							return {'state': stateobj} 
						});

		state_objs.forEach(function(state){
			_.extend(state, helper_functions);
			$('#telecom-selector').append(telecomList_TF(state));
		});

		// append budgets to the DOM

		budget_objs.forEach(function(budget){
			_.extend(budget, helper_functions);
			$('#budget-selector').append(budgetList_TF(budget));
		});

		// make name keys pretty and operator names lowercase. Calculate bits/day/rupee, create an obj typelist from type separated by /.
		plans.forEach(function(plan){
			plan.statekey = helper_functions.cleanlabel(plan.state);
			plan.operatorkey = helper_functions.cleanlabel(plan.operator);
			plan.dataperdayperrupee = (plan.total_data/plan.validity)/plan.cost;
			if ( plan.type.indexOf('/') >=0 ){
				plan.typelist = plan.type.split('/');
			// console.log(plan)
				
			} else {
				plan.typelist = plan.type;
			}
		});

		// things that happen after the submit button is clicked
		
		$('#submit-button').on('click',function(){

			// first feed in the form data to the menu object

			menu_status.circle = getcircle();
			menu_status.budget = getbudget();
			menu_status.provider = getoperator();

			// check for missing data

			if (missingdata()){
				alert('Missing Data. Try again!')
			} 

			else {
			
				$('.scenario-box').html('')
				$('#content').addClass('show');

				// calculate costs
				plans.forEach(function(plan){
					plan.dataperday_beingused = plan.dataperdayperrupee * menu_status.budget;
				});

				$('#telecom-map').attr('data-selected-circle', menu_status.circle);

				var gotdata = getmydata(plans);

				var indata = getInternet(gotdata);
				// console.log(indata)
				var nonndata = getNonNN(gotdata);

				slider_totals.yes_nn.total = somemath(indata);
				slider_totals.no_nn.total = somemath (nonndata);
				impmath();

				

				// function to hook up with backbone

				//bake out scenarios here

				scenarios.forEach(function(scene){
					// console.log(scene)
					_.extend(scene, helper_functions);
					$('#yes-nn .scenario-box').append(scenario_TF(scene));
					$("#slider-"+scene.scenario_name).slider({value:scene.figure, min: scene.min, max: scene.max, step: scene.breaks, slide: function( event, ui ){
							var round = helper_functions.rndnumber(ui.value);
			       	 		$("#"+scene.scenario_name+" .figure").html(helper_functions.addComma(round));
			       	 		scene.data_used=ui.value * scene.unit;
		       	 			// calculateuseddata();
		       	 		}
		    		});
				});

				// non-neutral math here

				non_netneutral.max = slider_totals.no_nn.total/non_netneutral.unit;
				non_netneutral.breaks = non_netneutral.max/number_of_breaks
				// console.log(non_netneutral)
			
				$( "#slider1" ).slider({value:0, min: 0, max: non_netneutral.max, step: non_netneutral.breaks , slide: function( event, ui ) {
					var round = helper_functions.rndnumber(ui.value);
		       	 	$( "#sc-1 .figure" ).html(helper_functions.addComma(round));}
		    	});

			}
				
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