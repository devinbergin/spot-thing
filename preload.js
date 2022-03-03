// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  	const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}
	
	// jquery
	var $ = require('jquery');
	window.jQuery = window.$ = $;

	// spotify api
	var SpotifyWebApi = require('spotify-web-api-node');

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

	// 1. Open the app and get this URL from console.
	// 2. visit the url in browser and copy the code only into the code var below inside spotLogo func	
	// 3. Refresh the app ctrl+shift+r click the spot logo
	// 4. Click the spotify logo
	// 5. USE THE APP BABY
	console.log(authorizeURL);

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
		var code = 'AQAmE2MMf8Mp2SAA5dUkcbwYuP1PlHms583tKj6rKXvh4SO9FqrfKFtBlqJkcBKh6vfnL_lNaMlFaJXFirPL6pRONtXi4Spb33g8InD0tUqI2XwwrRKGmWVdb1VvDTlpefgBaAFB3AclDaj0akKMeb-rZdHEqsXdTo7MXhJMN2XldXn52SaW6M4gpvWp6oO2TRN00q8yRIsyBHW-4O76wGo9IdyyAH7_Z9LJSZnXMUs9enIzxbTykdH9s0vffRaODG66Y-JW3fnVFDEln6-BilzJ0WqkygdbzXA00m006miZgI_HvAxONNW9nfadbhcafmo';
	
		// Retrieve an access token and a refresh token
		spotifyApi.authorizationCodeGrant(code).then(
		function(data) {
			console.log('The token expires in ' + data.body['expires_in']);
			console.log('The access token is ' + data.body['access_token']);
			console.log('The refresh token is ' + data.body['refresh_token']);
		
			// Set the access token on the API object to use it in later calls
			spotifyApi.setAccessToken(data.body['access_token']);
			spotifyApi.setRefreshToken(data.body['refresh_token']);
		},
		function(err) {
			console.log('Something went wrong!', err);
		}
		);
	});

	// Need to move thise somewhere else.. might also need to dynamically do it whenever the app gets a response back that the token has expired
	$("#xyz").click(function() {
		// clientId, clientSecret and refreshToken has been set on the api object previous to this call.
		spotifyApi.refreshAccessToken().then(
			function(data) {
			console.log('The access token has been refreshed!');
		
			// Save the access token so that it's used in future calls
			spotifyApi.setAccessToken(data.body['access_token']);
			},
			function(err) {
			console.log('Could not refresh access token', err);
			}
		);
	});
	
	// TODO - find a better way to refresh info
	$("#albumArt").click(function() {
		// Get the User's Currently Playing Track 
		spotifyApi.getMyCurrentPlayingTrack()
			.then(function(data) {
				console.log('Now playing track: ' + data.body.item.name);
				console.log('Now playing artist[0]: ' + data.body.item.artists[0].name);
				console.log('Now playing album: ' + data.body.item.album.name);
				console.log('Now playing image: ' + data.body.item.album.images[0].url);
				//console.log('Now playing: ' + JSON.stringify(data.body));
				$('#songName').text(data.body.item.name);
				$('#artistName').text(data.body.item.artists[0].name);
				$('#albumName').text(data.body.item.album.name);
				$('#albumArt').attr('src',data.body.item.album.images[0].url);


			}, function(err) {
				console.log('Something went wrong!', err);
		});
	});

	// Toggle the shuffle state
	$("#shuffle").click(function() {
		if ($('#shuffle').hasClass('shuffleInactive')) {
		
			spotifyApi.setShuffle(true)
			.then(function() {
				console.log('Shuffle is on.');
				$('#shuffle').addClass('shuffleActive');
				$('#shuffle').removeClass('shuffleInactive');
			}, function  (err) {
				//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
				console.log('Something went wrong!', err);
			});

		} else {
			spotifyApi.setShuffle(false)
			.then(function() {
				console.log('Shuffle is off.');
				$('#shuffle').removeClass('shuffleActive');
				$('#shuffle').addClass('shuffleInactive');
			}, function  (err) {
				//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
				console.log('Something went wrong!', err);
			});
		}
	});

	$("body").on("click", "#pause", function(){
		// Pause the User's Playback 
		spotifyApi.pause()
		.then(function() {
			console.log('Playback paused');
			$('#playPause').html('<i class="fa-solid fa-play" id="play"></i>');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			console.log('Something went wrong!', err);
		});
	});

	$("body").on("click", "#play", function(){
		// Start/Resume a User's Playback 
		spotifyApi.play()
		.then(function() {
			console.log('Playback started');
			$('#playPause').html('<i class="fa-solid fa-pause" id="pause"></i>');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			console.log('Something went wrong!', err);
		});
	});

	// TODO: when you click next, get the currently playing info and update it in the UI
	// TODO: when you click next if we are paused we need to update the play icon so the user can pause since moving to the next song auto plays
	$("#nextSong").click(function() {
		// Skip User’s Playback To Next Track
		spotifyApi.skipToNext()
		.then(function() {
			console.log('Skip to next');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			console.log('Something went wrong!', err);
		});
	});

	// TODO: when you click back, get the currently playing info and update it in the UI
	// TODO: when you click back if we are paused we need to update the play icon so the user can pause since moving to the back song auto plays
	$("#backSong").click(function() {
		// Skip User’s Playback To Previous Track 
		spotifyApi.skipToPrevious()
		.then(function() {
			console.log('Skip to previous');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			console.log('Something went wrong!', err);
		});
	});
	
	
  
})
