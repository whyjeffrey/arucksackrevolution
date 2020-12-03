Router.configure({
	//setting main templates for the router
	layoutTemplate: 'main',
	loadingTemplate: 'loading'
});

Router.route('/register');

Router.route('/login');

Router.route('/', {
	name: 'welcomepic',
	template: 'welcomepic'
});

Router.route('/accounts',{
	name: 'useraccounts',
	template: 'useraccounts',
	onBeforeAction: function() {
		// body...
		var currentUser = Meteor.userId();
		if(currentUser) {
			this.next();
		} else {
			this.render('login')
		}
	}
});

Router.route('/gear',{
	name: 'gear',		
	template: 'gear',
	waitOn: function(){
		Meteor.subscribe('GearCategories');
	}
});

Router.route('/mygear',{
	name: 'mygear',
	template: 'mygear',
	waitOn: function(){
		Meteor.subscribe('GearList');
	}
});

Router.route('/gearlists/:_id',{
	template: 'mytriplists',
	name: 'mytriplists',
	data: function(){
		var currentlist = this.params._id;
		return UserProfile.findOne({"TripListing._id":currentlist},{"TripListing.$":1});
	},
	waitOn: function(){
		Meteor.subscribe('GearList');
	}
});

Router.route('/contact',{
	name: 'contact',
	template: 'contact'
});

Router.route('/KayakingMap',{
	template: 'kayaking_map',
	name: 'kayaking_map'
	// waitOn: function(){
	// 	var radius = $('input[name="radius"]:checked').val();
	// 	var map_center = GoogleMaps.maps.KayakMap.instance.getCenter().toJSON();
	// 	debugger;
	// 	Meteor.subscribe('River_geoJSON');
	// },
	// action: function(){	
	// 	if (this.ready()){
	// 		this.render('kayaking_map');
	// 	} else {
	// 		this.render('loading');
	// 	}
	// }
});

// Router.route( '/verify-email/:token', {
//   name: 'verify-email',
//   action( params ) {
//     Accounts.verifyEmail( params.token, ( error ) =>{
//       if ( error ) {
//         Bert.alert( error.reason, 'danger' );
//       } else {
//         Router.go( 'useraccounts' );
//         Bert.alert( 'Email verified! Thanks!', 'success' );
//       }
//     });
//   }
// });

UserProfile = new Mongo.Collection('UserProfile');

GearList = new Mongo.Collection('GearList');

GearBrands = new Mongo.Collection('GearBrands');

GearCategories = new Mongo.Collection('GearCategories');

RiverInfo = new Mongo.Collection('RiverInfo');

River_geoJSON = new Mongo.Collection('River_geoJSON')

River_geoJSON.allow({
  insert: function(){ return true }
});