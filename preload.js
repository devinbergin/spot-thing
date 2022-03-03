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
		var code = 'AQA5fOEleCFLHV6CUCl_dFLP7MghpNVl6YHfzpmmj8VpKwynYDlrYZdRumjXOoFvAsqRs30S9RVVZG3Ee71-gyovGrkLyZoV2NmPVRf9gvLVRM1UZl8ZJk4Z4MatwuGqw6ooRE3U5AeM03QxSogFb8U6vZdP2dXFEbZJl-qP9Vdy_Oasw9hVUjeXfr9uGoHRGgm7oC3Qzu_qlTGFyLsT8syjd_QTRD272gADMicTpdf9vPzMKuG4Vk0_nD1-wAvuoUZpnp1hxhbnNtCp0Ab4jnzi6ubNTx69Nkld70vN3kuox06RWSRHNMdHDBObtXbR9ds';
	
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
				//console.log('Now playing: ' + JSON.stringify(data));
				$('#songName').text(data.body.item.name);
				$('#artistName').text(data.body.item.artists[0].name);
				$('#albumName').text(data.body.item.album.name);
				$('#albumArt').attr('src',data.body.item.album.images[0].url);


			}, function(err) {
				console.log('Something went wrong!', err);
		});
	});

	// TODO - this only turns shuffle on, need to toggle on/off
	$("#shuffle").click(function() {
		spotifyApi.setShuffle(true)
		.then(function() {
			console.log('Shuffle is on.');
		}, function  (err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			console.log('Something went wrong!', err);
		});
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

	// TODO - this doesn't work when it's switched in after clicking pause
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
