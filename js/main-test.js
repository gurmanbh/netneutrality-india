(function(){

	// define templates here

	var telecomlist_Html = $('#selector-template').html();
	var telecomList_TF = _.template(telecomlist_Html);

	var budgetlist_Html = $('#budget-selector-template').html();
	var budgetList_TF = _.template(budgetlist_Html);

	var scenario_Html = $('#scenario-template').html();
	var scenario_TF = _.template(scenario_Html);

	var non_neutral_scenario_Html = $('#nn-scenario-template').html();
	var non_neutral_scenario_TF = _.template(non_neutral_scenario_Html);

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
			percentage_left:0,
			maxed_out: 'no'
		}

		,

		no_nn:{total: 0,
			used:0,
			left:0,
			percentage_used:0,
			percentage_left:0,
			maxed_out: 'no'
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
	var number_of_breaks = 25;
	var percent = 100;

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

	function gettypes(plans){
		var type_list = _.chain(plans)
						.pluck('typelist')
						.flatten()
						.uniq()
						.sort()
						.value();
		return(type_list);
	}

	// define the scenarios

	var non_netneutral = [{scenario_name:'wa',
		total_data:0,		
		figure:0,
		min:0,
		max:0,
		desc:'WhatsApp text messages',
		unit:0.001,
		breaks:200,
		current_number:0
		},

		{scenario_name:'fb',
		total_data:0,
		figure:0,
		min:0,
		max:0,
		desc:'times of checking your Facebook feed',
		unit:0.2,
		breaks:50,
		current_number:0
		}]

	var scenarios = [

		{scenario_name:'nn-text',
		figure:0,
		min:0,
		max:0,
		desc:'WeChat/Hike/WhatsApp text messages',
		unit:0.001,
		breaks:200,
		current_number:0,
		data_used:0
		},

		{scenario_name:'video',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of streaming video',
		unit:4,
		breaks:1,
		current_number:0,
		data_used:0
		},

		{scenario_name:'email',
		figure:0,
		min:0,
		max:0,
		desc:'text emails',
		unit:0.01,
		breaks:100,
		current_number:0,
		data_used:0
		},

		{scenario_name:'music',
		figure:0,
		min:0,
		max:0,
		desc:'minutes of streaming music',
		unit:0.65,
		breaks:5,
		current_number:0,
		data_used:0
		},

		{scenario_name:'browsing',
		figure:0,
		min:0,
		max:0,
		desc:'web pages of your choice',
		unit:0.1,
		breaks:100,
		current_number:0,
		data_used:0
		}

		// ,

		// {scenario_name:'navigation',
		// figure:0,
		// min:0,
		// max:0,
		// desc:'minutes of navigation',
		// unit:2.5,
		// breaks:0,
		// current_number:0,
		// data_used:0
		// }

	];


	// define the cool filtering functions here

	// getmydata filters on the basis of state and provider

	function getmydata(plans){
		var result = _.filter(plans, function(plan){
	    		return plan.operatorkey === menu_status.provider && plan.statekey === menu_status.circle && plan.filtercost <= menu_status.budget;
	    	});
		return(result);
	}

	// getInternet returns net neutral plans

	function getInternet(plans){
		var result = _.filter(plans, function(plan){
    		return plan.typelist == 'Internet';
    	})
		return(result);
	}
	
	// getNonNN returns non net neutral plans. It uses underscore's _.some function to check if our type list has anything in common with the checklist defined below.

	function getNonNN(plans){
		var checklist = ['Unlimited-WA','Unlimited-FB','Unlimited-TW','FB','TW','WA'];
		var result = _.filter(plans, function(plan){
        		var checked = _.some(checklist, function(check){
        			return _.contains (plan.typelist, check)
        		});
        		return checked
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
			// console.log(scene);
		});
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

	// function to calculate total used data

	function pushstuff() {
	  
	  if (slider_totals.yes_nn.left>0){
	 	$('#content #yes-nn .completed-progress').css({width:(slider_totals.yes_nn.percentage_used)+'%'});
		$('#content #yes-nn .bar p').html(helper_functions.rndnumber(slider_totals.yes_nn.percentage_used)+'% data used');
		} else {
			$('#content #yes-nn .completed-progress').css({width:100+'%'});
			$('#content #yes-nn .bar p').html('You used all your data');
		}
	}

	function getCombinedValues(){
	  var total = 0;
	  $('.valueslider').each(function(){
	  	total += +$(this).attr('data-used') || 0;
	  });
	  slider_totals.yes_nn.used = total;
	  slider_totals.yes_nn.left = slider_totals.yes_nn.total - slider_totals.yes_nn.used;
	  slider_totals.yes_nn.percentage_used = slider_totals.yes_nn.used/slider_totals.yes_nn.total*100;
	  pushstuff();
	  return slider_totals.yes_nn.percentage_used;
	}

	function printfigure (which, val){
		var round = helper_functions.rndnumber(val);
		$("#"+which+" .figure").html(helper_functions.addComma(round));
	  	$('#slider-'+which).attr('data-print', val);
	}

	// define budget list here
	var budgetlist = [20,25,50,75,100,150,200];
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
			plan.filtercost = plan.cost/plan.validity * number_of_days;
			plan.typelist = plan.type.split('/');
			if (!plan.typelist){
				plan.typelist = plan.type;
			}

		});

		// things that happen after the submit button is clicked
		
		$('#submit-button').on('click',function(){
			$('.bar').css({display:'block'})

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
				$('.comment-box').html('')
				$('.instructions').html('')
				$('#content').addClass('show');

				// calculate costs
				plans.forEach(function(plan){
					plan.dataperday_beingused = plan.dataperdayperrupee * menu_status.budget;
				});

				$('#telecom-map').attr('data-selected-circle', menu_status.circle);

				var gotdata = getmydata(plans);
				var indata = getInternet(gotdata);
				var nonndata = getNonNN(gotdata);

				console.log(indata)

				slider_totals.yes_nn.total = somemath(indata);

				if (nonndata.length>0){
					slider_totals.no_nn.total = somemath (nonndata);
				} else{
					slider_totals.no_nn.total = 'nodata';
				}

				impmath();

				var nntypes = gettypes(nonndata);
				 console.log(nntypes)

				if (gotdata.length>0){
					$('#comment').addClass('show');

				// check for no data. append buttons otherwise

					var unlimited_html = '<div class = "sc-box-type" ><h3>This provider has plans with Unlimited Facebook, Twitter and WhatsApp access in this region. New alternatives to these apps might suffer because of the same.</h3></div>'

					if (slider_totals.no_nn.total === 'nodata'){
						$('#no-nn .scenario-box').html('<h2 class="noplans">In this budget, this operator has a net neutral space in this area. There are no violations.</h2>')
					} else {
						if (_.contains(nntypes, 'FB')) {
								var fb_list = _.where(nonndata,{type:'FB'});
								var fb_mean = somemath(fb_list);
								console.log('this is fb list', fb_list);
								var gotobj = _.findWhere(non_netneutral, {scenario_name: 'fb'})
								gotobj.total_data = fb_mean;
								gotobj.max = gotobj.total_data / gotobj.unit;
								_.extend(gotobj,helper_functions)
								$('#no-nn .scenario-box').append(non_neutral_scenario_TF(gotobj)
								);
							}
						if (_.contains(nntypes, 'Unlimited-FB')) {
								$('#no-nn .scenario-box').append(unlimited_html)
							} 
						if (_.contains(nntypes, 'WA')){
								var wa_list = _.where(nonndata,{type:'WA'});
								var wa_mean = somemath(wa_list);
								var gotobj = _.findWhere(non_netneutral, {scenario_name: 'wa'})
								gotobj.total_data = wa_mean;
								gotobj.max = gotobj.total_data/gotobj.unit;
								_.extend(gotobj,helper_functions)
								console.log(gotobj)
								$('#no-nn .scenario-box').append(non_neutral_scenario_TF(gotobj));
								$('#no-nn .comment-box').append('<h2 class = "noplans">And that is all you get. It is a limited world after all.</h2>')
							}
						
				}
				//bake out scenarios here
				if (indata.length>0){
					$('#yes-nn .instructions').append('Adjust the sliders according to your usage')
					scenarios.forEach(function(scene){
						_.extend(scene, helper_functions);
						// this appends things to the dom
						$('#yes-nn .scenario-box').append(scenario_TF(scene));
						
						$("#slider-"+scene.scenario_name).slider({
							value:scene.figure, 
							min: scene.min, 
							max: scene.max, 
							step: scene.breaks, 

							slide: function(event, ui){
								console.log('sliding');
								var name = $(this).attr('data-which');
	      						var obj = _.findWhere (scenarios, {scenario_name: name});
				       	 		$(this).attr('data-value', ui.value);
				       	 		var data = ui.value * obj.unit;
				       	 		$(this).attr('data-used', data);
				       	 		var total = getCombinedValues();
				       	 		console.log(total)
				       	 		var which = $(this).attr('id');
				       	 		// console.log('printing which now', which)
				       	 		
				       	 		if (total > percent) {
	          						console.log('stopped')
	          						return false;
	     						}

	     						printfigure(name, ui.value);

	     						},

			       	 		start: function(event,ui){
			       	 			var total = getCombinedValues();
	      						var which = $(this).attr('id');
	      						var name = $(this).attr('data-which');
	      						var obj = _.findWhere (scenarios, {scenario_name: name});
	      						var val = $(this).attr('data-print');
	      						console.log(val);
	      						if (total > percent && val>0) {
	      							$(this).slider('value', ui.value - obj.breaks);
		                     		$(this).attr('data-value', ui.value - obj.breaks);
		                     		$(this).attr('data-used', ui.value * obj.unit);
		          					printfigure(name, ui.value - obj.breaks);
	      						} else if (total > percent && val == 0){
	      							return false;	
	      						}
		       	 			}
		    			});
					});} else if (indata.length==0){
				console.log('inside')
				var error = '<h3 class=noplans>This provider does not have any plans within your budget. Increase your budget or try another operator.</h3>';
				$('#yes-nn .scenario-box').append(error);
				$('.bar').css({display:'none'})
				}
				
				
				}	else{
				var error = '<h3 class=noplans>This provider does not have any plans within your budget. Increase your budget or try another operator.</h3>';
				$('.scenario-box').append(error);
				$('.bar').css({display:'none'})
				}
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