import { Meteor } from 'meteor/meteor';

// Meteor.startup(() => {
//   // code to run on server at startup
//     UploadServer.init({
//     tmpDir: '/Users/schleic/rucksackrevolution/public/Uploads/tmp',
//     uploadDir: '/Users/schleic/rucksackrevolution/public/Uploads/',
//     checkCreateDirectories: true,
//     getDirectory: function(fileInfo, formData) {
//       // create a sub-directory in the uploadDir based on the content type (e.g. 'images')
//       return formData.contentType;
//     },
//     getFileName: function(file, formData) {
//   	return new Date().getTime() + '-' + Math.floor((Math.random() * 10000) + 1) + '-' + file.name; 
//   	// we get this value in the ajax response
//   	},
//     finished: function(fileInfo, formFields) {
//       // perform a disk operation
//       return fileInfo;
//     },
//     cacheTime: 100,
//     mimeTypes: {
//         "xml": "application/xml",
//         "vcf": "text/x-vcard"
//     }
//   });
// });
Meteor.methods({
  // method for email verification
  // 'sendVerificationLink': function(){
  //   let userId = Meteor.userId();
  //   if(userId){
  //     return Accounts.sendVerificationEmail(userId)
  //   }
  // },
  // this method is called when the user registers. It will then create a new profile with their information
  'createNewProfile': function(data){
    UserProfile.insert(data);
  },  
  //this method is called whenever the Add on the gear menu is clicked. it will add the gear to the person's profile
  'AddGear': function(gearid){
    UserProfile.update({userId: this.userId}, {$addToSet: {mygear: {nameid: gearid, quantity: 0}}})
  },
  //this method will remove the gear from the users profile
  'RemoveGear': function(gearid){
    UserProfile.update({userId: this.userId}, {$pull: {mygear: {nameid: gearid}}});
  },
  // this adds a trip list to the UserProfile
  'AddTripList': function(newlistname){
    if(newlistname.trim().length == 0){
      newlistname = defaultName(newlistname);
    }
    UserProfile.update({userId: this.userId}, {$addToSet: {TripListing: {name: newlistname, _id: Random.id()}}});
  },
  // here we delete the trip list that the user clicks
  'DeleteTripList': function(thislistname){
    UserProfile.update({userId: this.userId},{$pull: {"TripListing":{"_id":thislistname}}});
  },
  // add gear item to gear listing
  'AddGearToTripList': function(clientids){
    UserProfile.update(
      {userId: this.userId,"TripListing._id":clientids.listid},
      {$push:
        {"TripListing.$.SpecificGear":
          {nameid: clientids.gearid, quantity: 0}
        }
      }
    );
  },

  // remove gear from trip list
  'RemoveSpecificGear': function(clientids){
    UserProfile.update({userId: this.userId,"TripListing._id":clientids.triplistid},
    {$pull: {"TripListing.$.SpecificGear":{"nameid":clientids.gearid}}
    });
  },

  // update user's profile
  'MeteorUpdateProfile': function(username, email){
    Meteor.users.update({'_id': this.userId}, {$set: {'emails.0.address': email}});
    UserProfile.update({'userId': this.userId},{$set:{'profile.username':username}});
  }
});

// this function will check current lists in the User's DB and add a letter to make it auto incrementing
function defaultName(currentUser) {
    var nextLetter = 'A'
    var nextName = 'List ' + nextLetter;
    for (var i = UserProfile.findOne({}).TripListing.length - 1; i >= 0; i--) {
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      nextName = 'List ' + nextLetter;
    }
    return nextName;
};

Meteor.publish('UserProfile',function(){
  return UserProfile.find({userId: this.userId});
});

Meteor.publish('GearBrands',function(){
  return GearBrands.find();
});

Meteor.publish('GearList',function(){
  var mygearing = UserProfile.findOne({userId: this.userId}).mygear;
  var mygearids = mygearing.map(function(item){ return item.nameid});
  return GearList.find({"_id":{$in: mygearids}});
});

Meteor.publish('RiverInfo',function(){
  return RiverInfo.find({},{limit: 10});
});

Meteor.publish('River_geoJSON',function(radius,map_center){
  var METERS_PER_MILE = 1609.34;
  if(radius > 300){
    radius = 300;
  }
  if (radius < 0){
    radius = 0;
  }
  if(map_center == null){
    map_center = {lat: 42.733861499999996, lng: -73.68201099999999}
  }
  return River_geoJSON.find(
      { "location": {
       $nearSphere: {
        $geometry: {
         type: "Point",
         coordinates: [map_center.lng, map_center.lat]
        },
        $maxDistance: radius * METERS_PER_MILE
        }
       }
      });
});

SearchSource.defineSource('GearList', function(searchText, option) {
  var options = {sort: {isoScore: -1}, limit: 40};

  if(searchText) {
    var regExp = buildRegExp(searchText);
    //var selector = {'name': regExp, 'category': regExp};
    var selector = {'name': regExp};
    return GearList.find(selector, options).fetch();
  } else {
    return GearList.find({}, options).fetch();
  }
});

function buildRegExp(searchText) {
  var words = searchText.trim().split(/[ \-\:]+/);
  var exps = _.map(words, function(word) {
    return "(?=.*" + word + ")";
  });
  var fullExp = exps.join('') + ".+";
  return new RegExp(fullExp, "i");
};
