window.addEventListener('DOMContentLoaded', () => {
  	
	// Set to 1 to turn on console logging
	var debug = 1;

	// Notes for testing
	// clientID: cda49a979d894afaaa13b9975b773cf9
	// clientSecret: d88c8c755c3d471c8c7de6db709c21df
	// redirectURI: http://localhost:8888/callback

	// jquery
	const $ = require('jquery');
	window.jQuery = window.$ = $;

	// Spotify api
	const SpotifyWebApi = require('spotify-web-api-node');

	// filesystem for writing client data to json
	const fs = require('fs');

	// Open for sending URL to default browser
	const open = require('open');

	// Querystring for parsing URL
	const queryString = require('query-string');

	// fast-color & request & shader for getting album artwork color
	const color = require('fast-average-color-node');
	const request = require('request');
	const shader = require('shader');

	// For getting the local username - TODO dont need this pkg anymore
	const os = require ('os');
	const username = os.userInfo ().username;
	
	// Declare user input variables
	var clientID;
	var clientSecret;
	var redirectURI;
	var callbackURL;

	// Declare some globals
	var spotifyApi;

	// Check if the clientData.json already exists
	// If found, we refresh the access token and then run the normal startIntervals
	var pathData = 'C:\\ProgramData\\spot-thing\\clientData.json';
	fs.readFile(pathData, "utf8", (err, clientData) => {
		if (err) {
			// No file found, do nothing
			debug && console.log("File read failed:", err);
			return;
		}

		// We found the file, now get the data
		var clientDataArray = JSON.parse(clientData);
		var accessToken = clientDataArray.accessToken;
		var refreshToken = clientDataArray.refreshToken;

		debug && console.log("File data:", clientData);
		debug && console.log("clientDataArray:", clientDataArray);
		debug && console.log("accessToken:", accessToken);
		debug && console.log("refreshToken:", refreshToken);

		// Get the secrets from the clientSecrets file
		var pathSecrets = 'C:\\ProgramData\\spot-thing\\clientSecrets.json';
		fs.readFile(pathSecrets, "utf8", (err, clientSecrets) => {
			if (err) {
				// No file found, do nothing
				debug && console.log("File read failed:", err);
				return;
			}

			// We found the file, now get the secrets
			var clientSecretsArray = JSON.parse(clientSecrets);
			var clientID = clientSecretsArray.clientID;
			var clientSecret = clientSecretsArray.clientSecret;
			var redirectURI = clientSecretsArray.redirectURI;

			debug && console.log("File data:", clientSecrets);
			debug && console.log("clientSecretsArray:", clientSecretsArray);
			debug && console.log("clientID:", clientID);
			debug && console.log("clientSecret:", clientSecret);
			debug && console.log("redirectURI:", redirectURI);

			// Set credentials to pass over
			var credentials = {
				clientId: clientID,
				clientSecret: clientSecret,
				redirectUri: redirectURI
			};

			debug && console.log(JSON.stringify(credentials));

			spotifyApi = new SpotifyWebApi(credentials);
			spotifyApi.setAccessToken(accessToken);
			spotifyApi.setRefreshToken(refreshToken);

			// Refresh the access token that we found
			spotifyApi.refreshAccessToken().then(
				function(data) {
					debug && console.log('The access token has been refreshed!');
			
					// Save the access token so that it's used in future calls
					spotifyApi.setAccessToken(data.body['access_token']);

					// Setup json array to save secrets locally for later
					var clientData = {
						accessToken: data.body['access_token'],
						refreshToken: refreshToken
					};

					// Write client data to json file
					var clientDataString = JSON.stringify(clientData);
					var path = 'C:\\Users\\'+username+'\\AppData\\Local\\spot-thing\\';
					
					if (!fs.existsSync(path)){
						fs.mkdirSync(path);
						fs.writeFileSync(path+'clientData.json',clientDataString);
					} else {
						fs.writeFileSync(path+'clientData.json',clientDataString);
					}

					// Start the intervals
					startIntervals(refreshToken);
				},
				function(err) {
					debug && console.log('Could not refresh access token', err);
				}
			);

			// Hide the forms
			$('#idSecret').hide();
			$('#urlCode').hide();

			// Show a loading message while we get data back from the API
			$('#loading').show();

		});
	});

	// First form
	$("#idSecretNext").click(function() {		
		// Check if the fields are filled out
		if ($('#idSecretForm')[0].checkValidity() == false) {
			$('#idSecretForm')[0].reportValidity()
		} else {
		
			// Get the secrets
			clientID = $('#clientIDInput').val();
			clientSecret = $('#clientSecretInput').val();
			redirectURI = $('#redirectInput').val();

			debug && console.log(clientID);
			debug && console.log(clientSecret);
			debug && console.log(redirectURI);

			var scopes = ['user-read-currently-playing','user-read-playback-position','user-modify-playback-state','user-read-playback-state'],
				redirectUri = redirectURI,
				clientId = clientID,
				clientSecret = clientSecret,
				state = '';

			// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
			var spotifyApi = new SpotifyWebApi({
				redirectUri: redirectUri,
				clientId: clientId
			});

			// Create the authorization URL
			var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

			debug && console.log(authorizeURL);
			debug && console.log('clientSecret'+clientSecret);

			// Open the authorize URL for the user to accept and copy the callback url
			open(authorizeURL);

			// Hide the first form and unhide the second one
			$('#idSecret').hide();
			$('#urlCode').show();
		}
	});

	// second form
	$("#urlCodeActivate").click(function() {
		// Get the clientSecret again because it gets lost on its way here
		clientSecret = $('#clientSecretInput').val();

		callbackURL = $('#callbackURL').val();
		
		// Parse the URL to find the code value
		var callbackURLString = callbackURL.toString();
		var queryStringVal = callbackURLString.split('?')[1]
		var parsed = queryString.parse(queryStringVal);
		var authCode = parsed.code;

		debug && console.log('callbackURL: ' + callbackURL);
		debug && console.log('callbackURLString: ' + callbackURLString);
		debug && console.log('queryStringVal: ' + queryStringVal);
		debug && console.log('parsed: ' + parsed.code);
		debug && console.log('authCode: ' + authCode);
		
		// The code that's returned as a query parameter to the redirect URI
		var code = authCode;

		// Create json array for secrets
		var clientSecrets = {
			clientID: $('#clientIDInput').val(),
			clientSecret: $('#clientSecretInput').val(),
			redirectURI: $('#redirectInput').val(),
			code: code
		};

		// Store the secrets for later
		var clientSecretsString = JSON.stringify(clientSecrets);
		var path = 'C:\\ProgramData\\spot-thing\\';
		
		if (!fs.existsSync(path)){
			fs.mkdirSync(path);
			fs.writeFileSync(path+'clientSecrets.json',clientSecretsString);
		} else {
			fs.writeFileSync(path+'clientSecrets.json',clientSecretsString);
		}

		// Call the authorize function below and pass the code over
		authorizeSpot(code);

		// Hide the second form
		$('#urlCode').hide();
	});	

	function authorizeSpot(code) {		
		// Get the clientSecret again because it gets lost on its way here
		clientSecret = $('#clientSecretInput').val();
		
		// Set credentials to pass
		var credentials = {
			clientId: clientID,
			clientSecret: clientSecret,
			redirectUri: redirectURI
		};

		debug && console.log('credentials: ' + JSON.stringify(credentials));

		spotifyApi = new SpotifyWebApi(credentials);
		
		// Retrieve an access token and a refresh token
		spotifyApi.authorizationCodeGrant(code).then(
			function(data) {
				debug && console.log('The token expires in: ' + data.body['expires_in']);
				debug && console.log('The access token is: ' + data.body['access_token']);
				debug && console.log('The refresh token is: ' + data.body['refresh_token']);
	
				// Set the access token on the API object to use it in later calls
				spotifyApi.setAccessToken(data.body['access_token']);
				spotifyApi.setRefreshToken(data.body['refresh_token']);

				// setup json array to save secrets locally for later
				var clientData = {
					accessToken: data.body['access_token'],
					refreshToken: data.body['refresh_token']
				};

				// Write client data to json file
				var clientDataString = JSON.stringify(clientData);
				var path = 'C:\\ProgramData\\spot-thing\\';
				
				if (!fs.existsSync(path)){
					fs.mkdirSync(path);
					fs.writeFileSync(path+'clientData.json',clientDataString);
				} else {
					fs.writeFileSync(path+'clientData.json',clientDataString);
				}

				// Since we are activated now we can start the intervals
				startIntervals(data.body['refresh_token']);
			},
			function(err) {
				debug && console.log('Something went wrong!', err);
			}
		);
	};

	// We don't want to do this until we're authorized above
	function startIntervals(refreshToken) {
		// This refreshes currently playing
		// The Lofi dev seems to say his app users get throttled while he's making 1 call every second. Might need to bump to 2 or handle the 429 responses gracefully
		var intervalInfo = window.setInterval(function(){
			// Get the User's Currently Playing Track 
			spotifyApi.getMyCurrentPlaybackState()
				.then(function(data) {
					// Full API Response
					var currentlyPlaying = JSON.stringify(data.body);
					debug && console.log('currentlyPlaying: ' + currentlyPlaying);
					debug && console.log('currentlyPlaying.length: ' + currentlyPlaying.length);

					if (currentlyPlaying.length < 3) {
						debug && console.log('Nothing currently playing.');

						// Hide the loading overlay
						$('#loading').hide();

						// Nothing is playing so restart the loop from the top until it is
						$('#nothingPlaying').show();
						return;
					}

					// Hide the nothing playing overlay once we find activity
					$('#nothingPlaying').hide();

					// Hide the loading overlay
					$('#loading').hide();
					
					debug && console.log('Now playing track: ' + data.body.item.name);
					debug && console.log('Now playing artist[0]: ' + data.body.item.artists[0].name);
					debug && console.log('Now playing album: ' + data.body.item.album.name);
					debug && console.log('Now playing image: ' + data.body.item.album.images[0].url);
					debug && console.log('Now playing song progress ms: ' + data.body.progress_ms);
					debug && console.log('Now playing song duration ms: ' + data.body.item.duration_ms);
					debug && console.log('Artist URL: ' + data.body.item.artists[0].external_urls.spotify);
					debug && console.log('Song URL: ' + data.body.item.external_urls.spotify);
					debug && console.log('Is Playing (t/f): ' + data.body.is_playing);
					debug && console.log('Shuffle State (t/f): ' + data.body.shuffle_state);

					// Get album artwork color
					var url = data.body.item.album.images[0].url;
					request({ url, encoding: null }, (err, resp, buffer) => {
						color.getAverageColor(buffer).then(color => {
							debug && console.log('Album Color: '+color.hex);

							// Set the UI colors from the album artwork
							$('.titlebar').css('background',shader(color.hex, -.1));
							$('.dropdown-menu').css('background-color',shader(color.hex, -.1));
							$('.info').css('background',shader(color.hex, -.1));
							$('#controlsDefault.controls').css('background',shader(color.hex, -.4));
							$('#controlsAlt.controls').css('background',shader(color.hex, -.1));
							$('.progress').css('background-color',shader(color.hex, -.6));

							// Set the colors for the menu and dropdown items
							$('.window-title').css('background',shader(color.hex, -.1));
							$('.window-title').hover(
								function () {
								   $(this).css('background',shader(color.hex, -.2));
								}, 
								 
								function () {
								   $(this).css('background',shader(color.hex, -.1));
								}
							);
							
							$('.dropdown-item').hover(
								function () {
								   $(this).css('background',shader(color.hex, -.2));
								}, 
								function () {
								   $(this).css('background',shader(color.hex, -.1));
								}
							);
						});
					});

					// Calculate the percent complete for the progress bar
					var percentComplete = (data.body.progress_ms/data.body.item.duration_ms)*100;
					percentComplete = percentComplete.toFixed(0);

					// Set all the info of the currently playing track
					$('#songName').text(data.body.item.name);
					$('#songName').attr('title',data.body.item.name);
					$('#artistName').text(data.body.item.artists[0].name);
					$('#artistName').attr('title',data.body.item.artists[0].name);
					$('#albumName').text(data.body.item.album.name);
					$('#albumName').attr('title',data.body.item.album.name);
					$('#albumArt').attr('src',data.body.item.album.images[0].url);
					$('#albumURL').val(data.body.item.album.external_urls.spotify);
					$('.progress-bar').css('width', percentComplete+'%').attr('aria-valuenow', percentComplete);
					$('#songURL').val(data.body.item.external_urls.spotify);
					$('#artistURL').val(data.body.item.artists[0].external_urls.spotify);
					var playing = data.body.is_playing;
					var shuffle = data.body.shuffle_state;
					playing = playing.toString();
					shuffle = shuffle.toString();

					// Set play/pause icon
					if (playing == 'true') {
						$('#playPause').html('<i class="fa-solid fa-pause" id="pause"></i>');
					} else {
						$('#playPause').html('<i class="fa-solid fa-play" id="play"></i>');
					}

					// Set shuffle toggle
					if (shuffle == 'true') {
						$('#shuffle').addClass('shuffleActive');
						$('#shuffle').removeClass('shuffleInactive');
					} else {
						$('#shuffle').removeClass('shuffleActive');
						$('#shuffle').addClass('shuffleInactive');
					}

				}, function(err) {
					debug && console.log('Something went wrong!', err);
			});
		}, 2000);

		// Token expires every 60 minutes, so this refrehes it at 50 minutes
		var intervalRefresh = window.setInterval(function(){
			// clientId, clientSecret and refreshToken has been set on the api object previous to this call.
			spotifyApi.refreshAccessToken().then(
				function(data) {
					debug && console.log('The access token has been refreshed!');
			
					// Save the access token so that it's used in future calls
					spotifyApi.setAccessToken(data.body['access_token']);

					// Setup json array to save secrets locally for later
					var clientData = {
						accessToken: data.body['access_token'],
						refreshToken: refreshToken
					};

					// Write client data to json file
					var clientDataString = JSON.stringify(clientData);
					var path = 'C:\\ProgramData\\spot-thing\\';
					
					if (!fs.existsSync(path)){
						fs.mkdirSync(path);
						fs.writeFileSync(path+'clientData.json',clientDataString);
					} else {
						fs.writeFileSync(path+'clientData.json',clientDataString);
					}
				},
				function(err) {
					debug && console.log('Could not refresh access token', err);
				}
			);
		}, 3000000);
	};
	
	// Toggle the shuffle state
	$("#shuffle").click(function() {
		if ($('#shuffle').hasClass('shuffleInactive')) {
		
			spotifyApi.setShuffle(true)
			.then(function() {
				debug && console.log('Shuffle is on.');
				$('#shuffle').addClass('shuffleActive');
				$('#shuffle').removeClass('shuffleInactive');
			}, function  (err) {
				// TODO - handle gracefully - if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
				debug && console.log('Something went wrong!', err);
			});

		} else {
			spotifyApi.setShuffle(false)
			.then(function() {
				debug && console.log('Shuffle is off.');
				$('#shuffle').removeClass('shuffleActive');
				$('#shuffle').addClass('shuffleInactive');
			}, function  (err) {
				// TODO - handle gracefully - if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
				debug && console.log('Something went wrong!', err);
			});
		}
	});

	$("body").on("click", "#pause", function(){
		// Pause the User's Playback 
		spotifyApi.pause()
		.then(function() {
			debug && console.log('Playback paused');
			$('#playPause').html('<i class="fa-solid fa-play" id="play"></i>');
		}, function(err) {
			// TODO - handle gracefully - if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	$("body").on("click", "#play", function(){
		// Start/Resume a User's Playback 
		spotifyApi.play()
		.then(function() {
			debug && console.log('Playback started');
			$('#playPause').html('<i class="fa-solid fa-pause" id="pause"></i>');
		}, function(err) {
			// TODO - handle gracefully - if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	$("#nextSong").click(function() {
		// Skip User’s Playback To Next Track
		spotifyApi.skipToNext()
		.then(function() {
			debug && console.log('Skip to next');
		}, function(err) {
			// TODO - handle gracefully - if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	$("#backSong").click(function() {
		// Skip User’s Playback To Previous Track 
		spotifyApi.skipToPrevious()
		.then(function() {
			debug && console.log('Skip to previous');
		}, function(err) {
			// TODO - handle gracefully - if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	// Open Song in browser window
	$('#songName').click(function() {
		var songURL = $('#songURL').val();
		open(songURL);
	});

	// Open Artist in browser window
	$('#artistName').click(function() {
		var artistURL = $('#artistURL').val();
		open(artistURL);
	});

	// Open Album in browser window
	$('#albumName').click(function() {
		var albumURL = $('#albumURL').val();
		open(albumURL);
	});

	// Open Album in browser window
	$("#albumArt").click(function() {
		var albumURL = $('#albumURL').val();
		open(albumURL);
	});

	// Dropdown Menu
	$('#menu').click(function() {
		$('.dropdown-menu').toggle();
	});

	// About Link
	$('#aboutLink').click(function() {
		$('#about').show();
	});

	// Close about overlay
	$('#aboutClose').click(function() {
		$('#about').hide();
	});

	// Bounce them to the main player on the web
	$('#nothingPlayingBtn').click(function() {
		open('https://open.spotify.com/');
	});

	// Bug Report Link
	$('#bugLink').click(function() {
		open('https://github.com/devinbergin/spot-thing/issues/new');
	});

	// Tip Link
	$('#tipLink').click(function() {
		open('https://www.buymeacoffee.com/devinbergin');
	});

	// Alternate Layout
	$('#altLayout').click(function() {
		var currentLayout = $('#currLayout').val();

		if (currentLayout == 'default') {
			// Set the input to alt layout first
			$('#currLayout').val('alt');

			// Resize the main window
			window.resizeTo(1200,200);

			// Change classes to realign everything
			$('.albumContainer').addClass('albumContainerAlt');
			$('.spot-thing .info').addClass('infoAlt');
			$('#controlsAlt').addClass('controlsAlt');

			$('.songContainer').removeClass('col-7');
			$('.albumContainer').removeClass('col-5');
			$('.songContainer').addClass('col-5');
			$('.albumContainer').addClass('col-3');

			// Show alt progress and controls
			$('#progressDefault').hide();
			$('#progressAlt').show();

			$('#controlsDefault').hide();
			$('#controlsAlt').show();


		} else {
			// Set the input to default layout first
			$('#currLayout').val('default');

			// Resize the main window
			window.resizeTo(500,275);


		}


	});

	// Close the app
	$('#close-button').click(function() {
		window.close();
	});
  
});