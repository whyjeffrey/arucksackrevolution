$.validator.setDefaults({
	rules: {
				email: {
					required: true,
					email: true
				},

				password: {
					required: true,
					minlength: 6
				},

				confirmpassword: {
					equalTo: "#password"
				}
			}
});

var Highcharts = require('highcharts');

Template.login.events({
	'submit form': function(event){
		event.preventDefault();
	}
});

Template.login.onRendered(function() {
	// body...
	// simple jQuery validation for the login template
	var validator = $('.login').validate({
		submitHandler: function(event){
			var email = $('[name=email').val();
			var password = $('[name=password]').val();
			Meteor.loginWithPassword(email, password, function(error){
				//call back function code
				if (error) {
					if (error.reason == "User not found"){
						validator.showErrors({
							email: error.reason
						});
					}
					if(error.reason == "Incorrect password"){
						validator.showErrors({
							password: error.reason
						});
					}
				}else {
					var currentRoute = Router.current().route.getName();
					var currentUser = Meteor.userId();
					if(currentRoute == "login"){
						Router.go("useraccounts");
					}
				}
			});
		}
	})
});

Template.register.events({
	'submit form': function(event){
		event.preventDefault();	
	}
});

Template.register.onRendered(function(){
	// simple jQuery validation for a new user
	// When the user logs in this is creating their Meteor User Account 
	// it is also creating a UserProfile in a serperate collection
	// this other profile is used to store the person's gear list and personal preferences
	var validator = $('.register').validate({
		submitHandler: function(event){
			var email = $('[name=email]').val();
			var password = $('[name=password]').val();
			var username = $('[name=username]').val();
			var confirmpassword = $('[name=confirmpassword]').val();
			Accounts.createUser({
				email: email,
				password: password
			}, function(error){
				//callback function code
				if (error) {
					Bert.alert(error.reason,'danger');
				} else{
					//create new data profile
					// Meteor.call('sendVerificationLink',(error,response)=>{
					// 	if(error){
					// 		Bert.alert(error.reason,'danger');
					// 	} else {
					// 		Bert.alert('Welcome!','success');
					// 	}
					// });
					var data = {userId: Meteor.userId(),
						profile: {
							profilepicture: "/images/foxprofile.jpg",
							username: username
						},
						mygear: []
					};
					Meteor.call('createNewProfile', data);
					Router.go('useraccounts');
				}
			});	
		}
	});
});	

Template.navigation.events({
	// simple logout code
	'click .logout': function(event){
		event.preventDefault();
		Meteor.logout();
		Router.go('login');
	}
});

Template.useraccounts.helpers({
	// This is the user accounts page. Just pulling the informnation from the profile collections
	// for the individual user
	'meteorprofile': function(){
		if(Meteor.user()){
			return {email: Meteor.user().emails[0].address}
		}		
	},

	'UserProfile': function(){
		if(Meteor.user()){
			return {profilepicture: UserProfile.findOne().profile.profilepicture, username: UserProfile.findOne().profile.username}
		}
	}
});

Template.useraccounts.events({
	// modal popup for the UserAccounts
	// will be used to change data in the proiles
	'click .editinfo': function(event){
		$('.ui.modal.info')
			.modal({
				closable : true,
				onDeny : function(){
					return false;
				},
				onApprove : function(){
					var username = $('[name=username]').val();
					var email = $('[name=email]').val();
					Meteor.call('MeteorUpdateProfile',username,email);
				}
			})
			.modal('show')
		;
	}
	// 'click .resend-verification-link': function( event, template ) {
	//     Meteor.call( 'sendVerificationLink', ( error, response ) => {
	//       if ( error ) {
	//         Bert.alert( error.reason, 'danger' );
	//       } else {
	//         let email = Meteor.user().emails[ 0 ].address;
	//         Bert.alert( `Verification sent to ${ email }!`, 'success' );
	//       }
	//     });
 // 	}	
});

Template.gear.events({
	// the gear template is the main gear page
	// the modal event is used to show the add gear modal. 
	// the add gear modal isn't complete since the add picture thing will take work
	// the keyup event is the search source collection to add the nifty search functionality for the gear database
	// thinking of adding ability to search brands, gear name, category, etc. 
	// not sure how to do all that searching yet

	'click .editinfo': function(event){
		$('.ui.modal.addgear')
			.modal('show');
	},

	"keyup .search.icon": _.throttle(function(e) {
	    var text = $('[name= SearchCriteria]').val();
	    GearSearch.search(text);
	 }, 200)

});

Template.allgear.events({
	// The allgear template is just the table of gear. 
	// this table is used across multiple templates
	'click .addbutton': function(){
		Meteor.call('AddGear',this._id);
	},

	'click .tablesorter': function(event){
		$('.tablesorter').tablesorter();
	},

	'click .removebutton': function(){
		Meteor.call('RemoveGear',this._id);
	},

	'click .removetripgear': function(){
		Meteor.call('RemoveSpecificGear',{
			gearid:this._id,
			triplistid: Router.current().params._id
		});
	}
});

// basic search source options
var options = {
  keepHistory: 1000 * 60 * 5,
  localSearch: true
};

// all fields returned from search source collections
var fields = ['name', 'category','gramWeight','brandId'];


// Actual searchsource query
// also subscribing the necessary data 
GearSearch = new SearchSource('GearList', fields, options);
Meteor.subscribe('GearBrands');

// Subscribing the userprofile's data to be used across the app.
// In server code it only publishes data for logged in user
Meteor.subscribe('UserProfile');

Template.gearwithbrands.helpers({

	// this fucntion gets the gear list from the gear database so weight, name, category and brand id
	getGear: function() {
		if(Router.current().route.getName() == "mygear"){
			  var mygearing = UserProfile.findOne({userId: Meteor.userId()}).mygear;
			  var mygearids = mygearing.map(function(item){ return item.nameid});
			  return GearList.find({"_id":{$in: mygearids}});
		} else if (Router.current().route.getName()=="mytriplists") {
			var specificgeararray = []
			triplistingid = Router.current().params._id;
			triplisting_array = UserProfile.findOne({userId: Meteor.userId()}).TripListing
			for (var i = triplisting_array.length - 1; i >= 0; i--) {
				if (triplistingid == triplisting_array[i]._id) {
					specificgeararray = triplisting_array[i].SpecificGear;
				}
			}
			var mygeariding = specificgeararray.map(function(item){ return item.nameid});
			return GearList.find({"_id":{$in: mygeariding}});
		} else {
			return GearSearch.getData({
	      	      sort: {name: 1}
	      	});	 	      
		}    								
	},

	// this gets the brand from the brandId from the gear returned in the previous search
	getBrands: function() {
		return GearBrands.findOne({uid:this.brandId});
	},

	// while loading thingy... hard to test on local server
	isLoading: function() {
		return GearSearch.getStatus().loading;
	},

	// this changes the add/remove button where appropiate
	addedgear: function() {
		var isadded = UserProfile.find({$and:[{userId: Meteor.userId()},{"mygear.nameid":this._id}]}).fetch();
		if(isadded.length == 0){
			return true;
		} else {
			return false;
		}
	},

	//check if route is mygear
	myroute: function(){
		if(Router.current().route.getName()=='mygear' || Router.current().route.getName()=='gear'){
			return true;
		} else {
			return false;
		}
	}
}); 

Template.mytriplists.helpers({

	//sample highchart code.
	createChart: function () {
		 // Use Meteor.defer() to craete chart after DOM is ready:
		 Meteor.defer(function() {
		 	  // Gather data: 
			var geardata = []
			$('#geartable tr').each(function(){
				$(this).find('td').each(function(){

				})
			})
			var table = document.getElementById("geartable");
			for (var i = 0, row; row = table.rows[i]; i++){
				geardata.push({
					name: table.rows[i].cells[0].innerHTML,
					y: Number(table.rows[i].cells[2].innerHTML)
				})
			}
		   // Create standard Highcharts chart with options:
		   Highcharts.chart('weightpiechart', {
		     title: {text:'My Trip Weight Breakdown'},
		     series: [{
		       type: 'pie',
		       data: geardata
		     }]
		   });
		 });
	}
});

Template.mygear.events({
	// code to add lists to the user's profile
	'submit form': function(event){
		event.preventDefault();
		var listname = $('[name="GearListInput"]').val();
		Meteor.call('AddTripList',listname);
		event.target.GearListInput.value = '';
	},

	'click icon': function(event){
		console.log("Clicked!");
	},

	'dragstart': function(event){
		event.dataTransfer = event.originalEvent.dataTransfer;

		var dragIcon = document.createElement('img');
    	dragIcon.src = 'http://jsfiddle.net/favicon.png';
    	dragIcon.width = 100;
    	event.dataTransfer.setDragImage(dragIcon, -10, -10);

		//event.preventDefault();
		event.dataTransfer.setData('text/plain', this._id);
	}
	
});

Template.triplistings.helpers({
	triplists: function(){
		return UserProfile.findOne({},{"TripListing":1}).TripListing
	}
});

Template.triplistings.events({
	'click .remove.circle.outline.icon': function(event){
		var gearlistid = this._id;
		var approve = confirm("Are you sure you want to delete this list?");
		if(approve == true){
			Meteor.call('DeleteTripList',gearlistid);
		};	
	}
});

Template.sidenav.events({
	'dragover': function(event){
		event.preventDefault();
	},

	'drop':function(event){
		event.dataTransfer = event.originalEvent.dataTransfer;
		event.preventDefault();
		event.stopPropagation();
		var data = event.dataTransfer.getData('text/plain');
		Meteor.call('AddGearToTripList',{
			listid:this._id,
			gearid:data
		});
	}
});
