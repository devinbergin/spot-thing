// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  	const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}

	// Set to 1 to turn on console logging
	var debug = 1;

	// jquery
	var $ = require('jquery');
	window.jQuery = window.$ = $;

	// spotify api
	var SpotifyWebApi = require('spotify-web-api-node');
	
	// Declare user input variables
	var clientID;
	var clientSecret;
	var redirectURI;
	var callbackURL;

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
			redirectUri = 'http://localhost:8888/callback',
			clientId = 'cda49a979d894afaaa13b9975b773cf9',
			clientSecret = 'd88c8c755c3d471c8c7de6db709c21df',
			state = '';

		// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
		var spotifyApi = new SpotifyWebApi({
			redirectUri: redirectUri,
			clientId: clientId
		});

		// Create the authorization URL
		var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

		debug && console.log(authorizeURL);

		// Open the authorize URL for the user to accept and copy the callback url
		window.open(authorizeURL, '_blank', 'location=yes,height=900,width=700,scrollbars=no,status=yes');

		// Problems with this atm - there's no URL bar for the user to copy from
	});

	// 1. Open the app and get this URL from console.
	// 2. visit the url in browser and copy the code only into the code var below inside spotLogo func	
	// 3. Refresh the app ctrl+shift+r click the spot logo
	// 4. Click the spotify logo
	// 5. USE THE APP BABY

	var credentials = {
	clientId: 'cda49a979d894afaaa13b9975b773cf9',
	clientSecret: 'd88c8c755c3d471c8c7de6db709c21df',
	redirectUri: 'http://localhost:8888/callback'
	};
		
	var spotifyApi;
	
	// 'Registration' button atm
	$("#spotLogo").click(function() {
		spotifyApi = new SpotifyWebApi(credentials);
		
		// The code that's returned as a query parameter to the redirect URI
		var code = 'AQBllQuhLM5cP6q8XSWygRFv-972vNyMfLUsw8AHKcYDkOCUAYtMYF2fMVajxYPblbQYJ8m1ggEz53UatHcaHK2a9mtkWQyq8QNdWTZaMuA6m0ByFos47iXULae6n0aA1fYjcN0fQUN-12NW8cnZZLCfx0H8HwidzebKKcqhWtCrQigSuVFjBzW3HrpZr6chTBv1hLBTWl27Xrdkw9Hk0tFZjuhfu6wK6iPs0q_kYDUYKM2wa11xsIQHsGVVTtaxCg0XrTsrknkhDEymPr8EYgmkJEKAxpLPB8xx9i02WNJZoEZKhk76UJh8_t-ISS79NUw';
	
		// Retrieve an access token and a refresh token
		spotifyApi.authorizationCodeGrant(code).then(
		function(data) {
			debug && console.log('The token expires in ' + data.body['expires_in']);
			debug && console.log('The access token is ' + data.body['access_token']);
			debug && console.log('The refresh token is ' + data.body['refresh_token']);
		
			// Set the access token on the API object to use it in later calls
			spotifyApi.setAccessToken(data.body['access_token']);
			spotifyApi.setRefreshToken(data.body['refresh_token']);
		},
		function(err) {
			debug && console.log('Something went wrong!', err);
		}
		);
	});

	// Need to move thise somewhere else.. might also need to dynamically do it whenever the app gets a response back that the token has expired
	$("#xyz").click(function() {
		// clientId, clientSecret and refreshToken has been set on the api object previous to this call.
		spotifyApi.refreshAccessToken().then(
			function(data) {
				debug && console.log('The access token has been refreshed!');
		
			// Save the access token so that it's used in future calls
			spotifyApi.setAccessToken(data.body['access_token']);
			},
			function(err) {
				debug && console.log('Could not refresh access token', err);
			}
		);
	});
	
	// This refreshes currently playing every 1 second until you click the album artwork (temporary)
	var intervalId = window.setInterval(function(){
		// Get the User's Currently Playing Track 
		spotifyApi.getMyCurrentPlayingTrack()
			.then(function(data) {
				debug && console.log('Now playing track: ' + data.body.item.name);
				debug && console.log('Now playing artist[0]: ' + data.body.item.artists[0].name);
				debug && console.log('Now playing album: ' + data.body.item.album.name);
				debug && console.log('Now playing image: ' + data.body.item.album.images[0].url);
				debug && console.log('Now playing song progress ms: ' + data.body.progress_ms);
				debug && console.log('Now playing song duration ms: ' + data.body.item.duration_ms);
				//console.log('Now playing: ' + JSON.stringify(data.body));

				var percentComplete = (data.body.progress_ms/data.body.item.duration_ms)*100;
				percentComplete = percentComplete.toFixed(0);

				$('#songName').text(data.body.item.name);
				$('#artistName').text(data.body.item.artists[0].name);
				$('#albumName').text(data.body.item.album.name);
				$('#albumArt').attr('src',data.body.item.album.images[0].url);
				$('.progress-bar').css('width', percentComplete+'%').attr('aria-valuenow', percentComplete);

			}, function(err) {
				debug && console.log('Something went wrong!', err);
		});
	  }, 1000);

	$("#albumArt").click(function() {
		clearInterval(intervalId) 
	});

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
	
	
  
})
