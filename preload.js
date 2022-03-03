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
		var code = 'AQChkaJadryxNhx6ETIqjCQtMzEeSmYhAFWUNDysSKjjxX2XMOeNMh7FKoL4q12c58vaNDqw4Bs8PlmpqY2p0EyqaDGlu4kbuK6txpSUUF14t1VqXMThmTMm7d131qdW8t46mY80ZsGmJwXAoK6DpJY-cPB9GL6FIuSWM7hwAwggzty_iGon4Hsv3oP9ErY_6ZrBQ1cO1nP3A9axNCKPtVl0kBN6WV_vcdN8XxuA-dOFlctJshHgYHlV9jkX9fVr7DwrsROFLLQ10uwDrq3TDgmrhCJ4ahGXEOMPTVwdgUu4wSdHGWEIhmrfouhONSDW7f0';
	
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
	$("#shuffle").click(function() {
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
	
	// TODO switch this over to actually pausing the song
	$("#pause").click(function() {
		// Get the User's Currently Playing Track 
		spotifyApi.getMyCurrentPlayingTrack()
			.then(function(data) {
				console.log('Now playing: ' + data.body.item.name);
			}, function(err) {
				console.log('Something went wrong!', err);
		});
	});

	// TODO: when you click next, get the currently playing info and update it in the UI -- currently it's 1 song behind
	// Skip to the next track
	$("#nextSong").click(function() {
		// Skip User’s Playback To Next Track
		spotifyApi.skipToNext()
		.then(function() {
			console.log('Skip to next');
		}, function(err) {
			//if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
			console.log('Something went wrong!', err);
		});

		// Get the User's Currently Playing Track 
		spotifyApi.getMyCurrentPlayingTrack()
		.then(function(data) {
			console.log('Now playing: ' + data.body.item.name);
			// Set the track name in the UI
			$('#songName').text(data.body.item.name);
		}, function(err) {
			console.log('Something went wrong!', err);
			$('#songName').text('Error');
		});
	});
	

  
})
