Accounts.emailTemplates.siteName = "Rocks Hurt";
Accounts.emailTemplates.from = "Rocks Hurt <theserockshurt@gmail.com>";

Accounts.emailTemplates.verifyEmail = {
	subject(){
		return "[Rocks Hurt] Verify Your Email Address" 
	},
	text(user,url){
		let emailAddress = user.emails[0].address,
			urlWithoutHash = url.replace('#/',''),
			supportEmail = "theserockshurt@gmail.com",
			emailBody = 'To verify your email address (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request this verification, please ignore this email. If you feel something is wrong, please contact us: ${supportEmail}.';
		return emailBody;
	}
};