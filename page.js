
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").append("New patient with ehrId: "+ehrId+" successfully created. <br><strong><a href='profile.html?ehrid="+ehrId+"'>Go to profile</a><strong>");
		                    $("#kreirajSporocilo").fadeIn("slow");
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}


function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = getUrlParameter('ehrid');

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#name").text(party.firstNames + " " + party.lastNames);
				$("#age").text(to_age(party.dateOfBirth));
				console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}

function getUrlParameter(name){
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return null;
	else
		return results[1];
}

function to_age(dateString){
  var birthday = new Date(dateString);
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs); 
  return Math.abs(ageDate.getFullYear() - 1970);
}


function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = timeStamp();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    "ehrId": ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<div class='alert alert-success' role='alert'>New record successfully created. Please <a href='#' onclick='window.location.reload()'>refresh </a>site.</div>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
	}
}

function preberiMeritveVitalnihZnakov(id){ 
	  return new Promise(function(resolve, reject) {
	  		sessionId = getSessionId();	

			var ehrId = getUrlParameter('ehrid');
			var result = [];
			var tip = id;

			if (!ehrId || ehrId.trim().length == 0) {
				$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
			} else {
				$.ajax({
				    url: baseUrl + "/view/" + ehrId + "/" + tip,
				    type: 'GET',
				    headers: {"Ehr-Session": sessionId},
				    success: function (res) {
				    	if (res.length > 0) {
					        for (var i in res) {
					        	if(tip == 'body_temperature'){
					        		result.push(res[i].temperature);
					        	} else if (tip == 'spO2'){
					        		result.push(res[i].spO2);
					        	} else if (tip == 'blood_pressure'){
					        		result.push(res[i].systolic);
					        	}  else if (tip == 'pulse'){
					        		result.push(res[i].pulse);
					        	} 
						    }
						    if(tip == 'body_temperature'){
				        		dataMin(result) < 35 ? redFlag('body_temperature_low') : null
		        				dataMax(result) > 38.9 ? redFlag('body_temperature_high') : null
				        	} else if (tip == 'spO2'){
				        		dataMin(result) < 91 ? redFlag('spO2') : null
				        	} else if (tip == 'blood_pressure'){
				        		dataMin(result) < 85 ? redFlag('blood_pressure') : null
				        	}  else if (tip == 'pulse'){
				        		dataMax(result) > 120 ? redFlag('pulse') : null
					        } 
						    
						    console.log(tip +" -- "+result);
						    resolve(result); 
				    	} else {
				    		console.log('Ni podatkov!');
				    	}
				    },
				    error: function() {
						console.log(JSON.parse(err.responseText).userMessage);
						reject(Error([0,0]));
				    }
				});
			}
	  });
}	 

function drawGraph(id){
	/* http://bl.ocks.org/1166403 */		
	preberiMeritveVitalnihZnakov(id).then(function(val) {
		var data = val;

		$('#'+id+'_head_num').append(getLastNum(data));

		var yMin = dataMin(val);
		var yMax = dataMax(val) + 5;

		var m = [10, 30, 20, 80]; // margins
		var w = 490 - m[1] - m[3]; // width
		var h = 200 - m[0] - m[2]; // height

		var x = d3.scale.linear().domain([0, data.length-1]).range([0, w]);
		var y = d3.scale.linear().domain([yMin, yMax]).range([h, 0]);
		var line = d3.svg.line()
			.x(function(d,i) { 
				return x(i); 
			})
			.y(function(d) { 
				return y(d); 
			})

		var graph = d3.select("#"+id).append("svg:svg")
		      .attr("width", w + m[1] + m[3])
		      .attr("height", h + m[0] + m[2])
		    .append("svg:g")
		      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

		var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true);
		graph.append("svg:g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + h + ")")
		      .call(xAxis);


		var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left");
		graph.append("svg:g")
		      .attr("class", "y axis")
		      .attr("transform", "translate(-25,0)")
		      .call(yAxisLeft);
		
		graph.append("svg:path").attr("d", line(data));

	}, function(error) {
		console.log(error.message);
	});
}

function getLastNum(data){
	return data[0];
}

function dataMax(val){
	return Math.max.apply(Math, val);
}
function dataMin(val){
	return Math.min.apply(Math, val);
}

function redFlag(problem){
	var message = $("#alert").val();
	if (problem == 'blood_pressure') {
		message += "Blood pressure is lower than 85mmHg";
	}
	if (problem == 'pulse') {
		message += "Hart rate is higher than 120bpm ";
	}
	if (problem == 'body_temperature_high') {
		message += "Body temperature is higher than 38.9◦C";
	}
	if (problem == 'body_temperature_low') {
		message += "Body temperature is lower than 35◦C";
	}
	if (problem == 'spO2') {
		message += "Oxygen saturation is lower than 91%";
	}

	$("#alert").append(message+', please visit hospital.<br>');
	$("#alert").fadeIn("slow");
}

function showLocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
}
function getLocation() {
    if (navigator.geolocation) {
    	navigator.geolocation.getCurrentPosition(getNearestHospital, showLocationError);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
function getNearestHospital(position) {
    console.log("Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude);
	var positionData = {
		            latitude: position.coords.latitude,
		            longitude: position.coords.longitude
		        };
 	$.ajax({
		    url: 'http://localhost:3000/hospital',
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(positionData),
		    success: function (res) {
		    	console.log('yeah!' + res.name + JSON.stringify(res));
		    	var img_url = 'https://maps.googleapis.com/maps/api/staticmap?center='+res.lat+','+res.lng+'&zoom=13&size=2000x300&maptype=roadmap&markers=color:red%7Clabel:C%7C'+res.lat+','+res.lng
		    	$("#map").append("<img src='" + img_url + "'>");
		    	$("#hospital_name").html('<b>'+res.name+'</b>');
		    	$("#hospital_address").append(res.formatted_address)
		    },
		    error: function(err) {
				console.log(JSON.parse(err.responseText).userMessage);
		    }
	});   
}

function master(name){
	var ehrId = $(name).val();

	$.ajax({
		url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
		type: 'GET',
		headers: {"Ehr-Session": sessionId},
    	success: function (data) {
			var party = data.party;
			console.log(party.firstNames + " " + party.lastNames);
			$(name + '_name').append(party.firstNames + " " + party.lastNames);
		},
		error: function(err) {
			console.log(JSON.parse(err.responseText).userMessage);
		}
	});
	//don't work with $
	document.getElementById(name.substring(1) + "_more").href = "profile.html?ehrid="+ehrId;
}

function detail(name){
	var ehrId = $(name).val();
	
	getDetailData('body_temperature', ehrId).then(function(val) {
		if ($(name + '_body_temperature').text() == '')
			$(name + '_body_temperature').append(val);
	}, function(error) {
		console.log(error.message);
	});

	getDetailData('blood_pressure', ehrId).then(function(val) {
		if ($(name + '_blood_pressure').text() == '')
			$(name + '_blood_pressure').append(val);
	}, function(error) {
		console.log(error.message);
	});

	getDetailData('pulse', ehrId).then(function(val) {
		if ($(name + '_pulse').text() == '')
			$(name + '_pulse').append(val);
	}, function(error) {
		console.log(error.message);
	});

	getDetailData('spO2', ehrId).then(function(val) {
		if ($(name + '_spO2').text() == '')
			$(name + '_spO2').append(val);
	}, function(error) {
		console.log(error.message);
	});
	$(name + '_vital_signs').fadeIn("slow");
}

function getDetailData(tip, ehrId){ 
	  return new Promise(function(resolve, reject) {
	  		sessionId = getSessionId();	
			var result = [];

			if (!ehrId || ehrId.trim().length == 0) {
				$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
			} else {
				$.ajax({
				    url: baseUrl + "/view/" + ehrId + "/" + tip,
				    type: 'GET',
				    headers: {"Ehr-Session": sessionId},
				    success: function (res) {
				    	if (res.length > 0) {
					        for (var i in res) {
					        	if(tip == 'body_temperature'){
					        		result.push(res[i].temperature);	
					        	} else if (tip == 'spO2'){
					        		result.push(res[i].spO2);
					        	} else if (tip == 'blood_pressure'){
					        		result.push(res[i].systolic);
					        	}  else if (tip == 'pulse'){
					        		result.push(res[i].pulse);
					        	} 
						    }
						    resolve(result[i]); 
				    	} else {
				    		console.log('Ni podatkov!');
				    	}
				    },
				    error: function() {
						console.log(JSON.parse(err.responseText).userMessage);
						reject(Error([0,0]));
				    }
				});
			}
	  });
}

function timeStamp() {
  var now = new Date();
  var date = [ now.getFullYear(), now.getMonth() + 1, now.getDate() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
  return date.join("-") + "T" + time.join(":")  + "." + now.getMilliseconds() + "Z";
}


$(document).ready(function() {
	preberiEHRodBolnika();
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoTelesnaVisina").val(podatki[0]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[1]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[2]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[3]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[4]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[5]);
		$("#dodajVitalnoMerilec").val(podatki[6]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
	$('#dodajVitalnoEHR').val(getUrlParameter('ehrid'));
	drawGraph('body_temperature');
	drawGraph('spO2');
	drawGraph('blood_pressure');
	drawGraph('pulse');
	$('#patient1_ehrid_vital_signs').hide();
	$('#patient2_ehrid_vital_signs').hide();
	$('#patient3_ehrid_vital_signs').hide();
	$('#kreirajSporocilo').hide();
	$("#alert").hide();
	
	if ($('#patient1_ehrid').length > 0) {
    	master('#patient1_ehrid');
		console.log('SE IZVEDE');
		master('#patient2_ehrid');
		master('#patient3_ehrid');
    }
		
});