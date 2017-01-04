var telewrap = (function(){
	
	//PERSON CREDENTIALS
	var PHONE_NUMBER = null;
	var PHONE_HASH_CODE = null;
	var USER_ID = null;

	// CHECK LOGIN
	var checkLogin = function(cb){
		telegramApi.getUserInfo().then(function(user){
		    if (user.id) {
		        // You have already signed in
		        console.log('already logged in');
		        USER_ID = user.id;
				subscribe(); // TO receive messages
		    } else {
		        // Log in
		        console.log('not logged in');
		    }
			
			typeof cb === 'function' && cb(user);
		});
	}

	// GET SEND CODE FOR LOGIN
	var getSendCode = function(phoneNumber){
		PHONE_NUMBER = phoneNumber;
		telegramApi.sendCode(phoneNumber).then(function(res){
			console.log('sendCode: ', res);
			if(res.phone_registered){
				PHONE_HASH_CODE = res.phone_code_hash
			} else {
				console.log('you need to go sign up first');
			}
		});
	}

	// LOGIN
	var login = function(phoneCode, cb){
		telegramApi.signIn(PHONE_NUMBER, PHONE_HASH_CODE, phoneCode).done(function(){
			subscribe();// listen for events
			console.log('You are now logged in!');
			typeof cb === 'function' && cb();
		})
	}

	var logout = function(){
		telegramApi.logOut().done(function(){
			telegramApi.unSubscribe(USER_ID, function(){
				console.log('Unsubscribed to polling events');
			});

			console.log('You are now logged out');
		})
	}

	// SUBSCRIBE TO POLLING EVENTS 
	var subscribe = function(){
		telegramApi.subscribe(USER_ID, function(res){
			console.log('subscribe polling: ', res);

			// check for messages being sent to you
			if (res._ === "updateShortMessage"){
				var messageFrom = '';
				if(res.user_id){
					// message sender, get his/her name from your contact list, if it's there. 
					getContacts(function(contacts){
						for( var i = 0; i < contacts.users.length; i++ ){
							if(contacts.users[i].id === res.user_id){
								if(contacts.users[i].first_name){
									messageFrom += contacts.users[i].first_name;
								}
								if(contacts.users[i].last_name){
									messageFrom += contacts.users[i].last_name;
								}
							}
						}
					});
					//TODO: get his/her name from your list of dialogs if he's not in your contact list. 

				}
				//alerting message
				alert("New Message: " + res.message + messageFrom);

				//speaking API
				responsiveVoice.speak("New Message: " + res.message + messageFrom);
			}
		});
	}

	// SEND MESSAGE
	var msgByName = function(name, message){
		if(name.trim() !== '' && message.trim() !== ''){
			getContacts(function(res){
				if(res.users){
					var loopDialog = true;
					for( var i = 0; i < res.users.length; i++ ){
						var contactName = ''; // has to be reset
						if(res.users[i].first_name){
							contactName += res.users[i].first_name.toLowerCase();
						}
						if(res.users[i].last_name){
							contactName += res.users[i].last_name.toLowerCase();
						}

						// sending message to user in contact list if there's a match
						if(contactName.indexOf(name) > -1 || contactName.indexOf(name) > -1 && name !== ''){
							console.log('will send message to contact: ', contactName);
							loopDialog = false;
							telegramApi.sendMessage(res.users[i].id, message);
							break; // Avoid spamming many people
						}
					}

					// looking through user list in your diaLogs
					if(loopDialog){ 
						console.log('got into diaLogs loop');
						telegramApi.getDialogs(0, 25).then(function(obj){
							if(obj.result.users){
								for( var i = 0; i < obj.result.users.length; i++ ){
									var contactName = '';
									if(obj.result.users[i].first_name){
										contactName += obj.result.users[i].first_name.toLowerCase();
									}
									if(obj.result.users[i].last_name){
										contactName += obj.result.users[i].last_name.toLowerCase();
									}
									// sending message to user in contact list if there's a match
									if(contactName.indexOf(name) > -1 || contactName.indexOf(name) > -1 && name !== ''){
										console.log('will send the message to Dialog:', contactName);
										telegramApi.sendMessage(obj.result.users[i].id, message);
										break; // Avoid spamming many people
									}
								}
							}
						});
					}
				}
			}); 
		}
	}

	// GET CONTACT LIST
	var getContacts = function(cb){
		telegramApi.invokeApi('contacts.getContacts', {
	      hash: ''
	    }).then(function (res) {
	      if(res){
	      	typeof cb === 'function' && cb(res);
	      }
	  });
	}

	// GET MESSAGE HISTORY
	var getHistory = function(id){
		telegramApi.getHistory({
		    id: id,
		    take: 50,
		    type: 'user'
		}).then(function(data) {
		    var totalCount = data.count || data.messages.length;
		    data.messages.forEach(function(message) {
		    	console.log(message);
		    });
		});
	}

	// GET FOREIGN CHAT HISTORY
	var getDialogs = function(){
		telegramApi.getDialogs(0, 10).then(function(res){
			console.log("GET DIALOG USERS: ", res);
		});
	}



	// telegram credentials
	telegramApi.setConfig({
	    app: {
	        id: 86117,
	        hash: 'c91ede7f4e866ba34a73889383203ab5',
	        version: telegramApi.VERSION
	    },
	    server: {
	        test: [
	        {id: 1, host: '149.154.175.10',  port: 80},
	        {id: 2, host: '149.154.167.40',  port: 80},
	        {id: 3, host: '149.154.175.117', port: 80}
	      ],
	        production: [
	        {id: 1, host: '149.154.175.50',  port: 80},
	        {id: 2, host: '149.154.167.51',  port: 80},
	        {id: 3, host: '149.154.175.100', port: 80},
	        {id: 4, host: '149.154.167.91',  port: 80},
	        {id: 5, host: '149.154.171.5',   port: 80}
	      ]
	    }
	});

	return {
		PHONE_NUMBER:        PHONE_NUMBER,
		PHONE_HASH_CODE:     PHONE_HASH_CODE,
		USER_ID:             USER_ID,
		checkLogin:          checkLogin,
		getSendCode:         getSendCode,
		login:               login,
		logout: 			 logout,
		subscribe:           subscribe,
		msgByName:           msgByName,
		getContacts:         getContacts,
		getHistory:          getHistory,
		getDialogs:          getDialogs,
	}
})();








