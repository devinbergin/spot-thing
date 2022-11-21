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

	// spotify api
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
	
	
	// Declare user input variables
	var clientID;
	var clientSecret;
	var redirectURI;
	var callbackURL;

	// Declare some globals
	var spotifyApi;

	// TODO: Need to add some error checking for the forms not being empty
	// first form
	$("#idSecretNext").click(function() {	
		// we have the secrets
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

	});

	// second form
	$("#urlCodeActivate").click(function() {
		// for some reason we're losing this - TODO find out why so we don't have to find it this way
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
		
		//debug && console.log(JSON.stringify('parsedURL: '+callbackURL));
		debug && console.log('authCode: ' + authCode);
		
		// The code that's returned as a query parameter to the redirect URI
		var code = authCode;

		// Call the authorize function below and pass the code over
		authorizeSpot(code);

		// Hide the second form
		$('#urlCode').hide();

	});

	// Close about overlay
	$('#aboutClose').click(function() {
		$('#about').hide();
	});	

	function authorizeSpot(code) {
		// for some reason we're losing this  - TODO find out why so we don't have to find it this way
		clientSecret = $('#clientSecretInput').val();
		
		// Set credentials to pass
		var credentials = {
			clientId: clientID,
			clientSecret: clientSecret,
			redirectUri: redirectURI
		};

		debug && console.log(JSON.stringify(credentials));

		spotifyApi = new SpotifyWebApi(credentials);
		
		// Retrieve an access token and a refresh token
		spotifyApi.authorizationCodeGrant(code).then(
			function(data) {
				debug && console.log('The token expires in ' + data.body['expires_in']);
				debug && console.log('The access token is ' + data.body['access_token']);
				debug && console.log('The refresh token is ' + data.body['refresh_token']);
	
				// Set the access token on the API object to use it in later calls
				spotifyApi.setAccessToken(data.body['access_token']);
				spotifyApi.setRefreshToken(data.body['refresh_token']);

				// setup json array to save secrets locally for later
				var clientData = {
					accessToken: data.body['access_token'],
					refreshToken: data.body['refresh_token']
				};

				// write client data to json file
				// TODO: find a good temp folder to store this in
				var clientDataString = JSON.stringify(clientData);
				fs.writeFileSync('clientData.json',clientDataString);

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
		// This refreshes currently playing every 1 second until you click the album artwork (temporary)
		// The Lofi dev seems to say his app users get throttled while he's making 1 call every second. Might need to bump to 2 or handle the 429 responses gracefully
		var intervalInfo = window.setInterval(function(){
			// Get the User's Currently Playing Track 
			spotifyApi.getMyCurrentPlaybackState()
				.then(function(data) {
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

					// Full API Response
					//debug && console.log('Now playing: ' + JSON.stringify(data.body));

					// Get album artwork color
					var url = data.body.item.album.images[0].url;
					request({ url, encoding: null }, (err, resp, buffer) => {
						color.getAverageColor(buffer).then(color => {
							debug && console.log('Album Color: '+color.hex);

							// Set the UI colors from the album artwork
							// TODO - set hover elements
							// TODO - set other random elements
							$('.titlebar').css('background',shader(color.hex, -.4));
							$('.dropdown-menu').css('background-color',shader(color.hex, -.5));
							$('.info').css('background','linear-gradient(-45deg, '+shader(color.hex, -.2)+' 0%, '+shader(color.hex, -.4)+' 30%)');
							$('.controls').css('background',shader(color.hex, -.6));
							$('.progress').css('background-color',shader(color.hex, -.8));

							$('.window-title').css('background',shader(color.hex, -.4));
							$('.window-title').hover(
								function () {
								   $(this).css('background',shader(color.hex, -.5));
								}, 
								 
								function () {
								   $(this).css('background',shader(color.hex, -.4));
								}
							);
						});
					});

					// Calculate the percent complete for the progress bar
					var percentComplete = (data.body.progress_ms/data.body.item.duration_ms)*100;
					percentComplete = percentComplete.toFixed(0);

					// Set all the info of the currently playing track
					$('#songName').text(data.body.item.name);
					$('#artistName').text(data.body.item.artists[0].name);
					$('#albumName').text(data.body.item.album.name);
					$('#albumArt').attr('src',data.body.item.album.images[0].url);
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
		// Still need to test this is working after 50 min
		var intervalRefresh = window.setInterval(function(){
			// clientId, clientSecret and refreshToken has been set on the api object previous to this call.
			spotifyApi.refreshAccessToken().then(
				function(data) {
					debug && console.log('The access token has been refreshed!');
			
				// Save the access token so that it's used in future calls
				spotifyApi.setAccessToken(data.body['access_token']);

				// setup json array to save secrets locally for later
				var clientData = {
					accessToken: data.body['access_token'],
					refreshToken: refreshToken
				};

				// write client data to json file
				// TODO: find a good temp folder to store this in
				var clientDataString = JSON.stringify(clientData);
				fs.writeFileSync('clientData.json',clientDataString);

				},
				function(err) {
					debug && console.log('Could not refresh access token', err);
				}
			);

		}, 3000000);

		// Clear both intervals - for testing only
		$("#albumArt").click(function() {
			clearInterval(intervalInfo);
			clearInterval(intervalRefresh);
		});

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
				//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
				debug && console.log('Something went wrong!', err);
			});

		} else {
			spotifyApi.setShuffle(false)
			.then(function() {
				debug && console.log('Shuffle is off.');
				$('#shuffle').removeClass('shuffleActive');
				$('#shuffle').addClass('shuffleInactive');
			}, function  (err) {
				//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
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
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	// TODO: if you leave it paused for long enough (10 min ish) then you can't click play I think because of the no active device response
	$("body").on("click", "#play", function(){
		// Start/Resume a User's Playback 
		spotifyApi.play()
		.then(function() {
			debug && console.log('Playback started');
			$('#playPause').html('<i class="fa-solid fa-pause" id="pause"></i>');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	// TODO: when you click next, get the currently playing info and update it in the UI
	// TODO: when you click next if we are paused we need to update the play icon so the user can pause since moving to the next song auto plays
	$("#nextSong").click(function() {
		// Skip User’s Playback To Next Track
		spotifyApi.skipToNext()
		.then(function() {
			debug && console.log('Skip to next');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	// TODO: when you click back, get the currently playing info and update it in the UI
	// TODO: when you click back if we are paused we need to update the play icon so the user can pause since moving to the back song auto plays
	$("#backSong").click(function() {
		// Skip User’s Playback To Previous Track 
		spotifyApi.skipToPrevious()
		.then(function() {
			debug && console.log('Skip to previous');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			debug && console.log('Something went wrong!', err);
		});
	});

	// Open Song in browser window
	$('#songName').click(function() {
		var songURL = $('#songURL').val();
		open(songURL);
	});

	// Dropdown Menu
	$('#menu').click(function() {
		$('.dropdown-menu').toggle();
	});

	// About Link
	$('#aboutLink').click(function() {
		$('#about').show();
	});

	// Bug Report Link
	$('#bugLink').click(function() {
		open('https://github.com/devinbergin/spot-thing/issues/new');
	});

	// Tip Link
	$('#tipLink').click(function() {
		open('https://www.buymeacoffee.com/devinbergin');
	});


	// Open Artist in browser window
	$('#artistName').click(function() {
		var artistURL = $('#artistURL').val();
		open(artistURL);
	});

	// Close the app
	$('#close-button').click(function() {
		window.close();
	});
  
});



