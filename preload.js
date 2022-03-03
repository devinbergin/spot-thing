// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

	var SpotifyWebApi = require('spotify-web-api-node');

	/**
	 * This example uses the Client Credentials authorization flow. 
	 */

	/**
	 * Get the credentials from Spotify's Dashboard page.
	 * https://developer.spotify.com/dashboard/applications
	 */

	 var scopes = ['user-read-private', 'user-read-email'],
	 	redirectUri = 'http://localhost:8888/callback',
	 	clientId = 'cda49a979d894afaaa13b9975b773cf9',
		clientSecret = 'd88c8c755c3d471c8c7de6db709c21df',
	 	state = 'user-read-playback-state';
   
	// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
	var spotifyApi = new SpotifyWebApi({
		redirectUri: redirectUri,
		clientId: clientId
	});
   
   	// Create the authorization URL
   	var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
   
   	// https://accounts.spotify.com/authorize?client_id=cda49a979d894afaaa13b9975b773cf9&response_type=code&redirect_uri=http://localhost:8888/callback&scope=user-read-private%20user-read-email&state=user-read-playback-state
   	console.log(authorizeURL);

   	// URL after I approved access
   	// http://localhost:8888/callback?code=AQCUuT1p9E2VaHgzdFBrBvsEStiaxt_P7uWlhEeUuT8kLLTFoy50vAzdGExrkNsJ5Rikq7O46UhEGm9x5hpwWGybBjx5xQo0DcBu10BkYiS3npGKf70ibVFKinebNiu62Zgz4nBj0Kam44ZSQidzCZvr0HD5KLLNkuvqNnVzfru9SAeH7mC82wii-mvkJFQtoixSQ7KQNugSIaDe2NGLhVNDAzjiiQ&state=user-read-playback-state

	var credentials = {
	clientId: 'cda49a979d894afaaa13b9975b773cf9',
	clientSecret: 'd88c8c755c3d471c8c7de6db709c21df',
	redirectUri: 'http://localhost:8888/callback'
	};
	
	var spotifyApi = new SpotifyWebApi(credentials);
	
	// The code that's returned as a query parameter to the redirect URI
	var code = 'AQC8y5DFI218K8y4NWwQI2JGSVgHVOSe219AR2xVZ-VndQ1LZYcWjEtkLHj2k5PINtQfh-waMBuCA78XlWxhuZtOtAT_lYAgajgbk5YUgAL0wtYo68kTemGIvrSfnpuE3jklWvLPgLpVsHj9BGHJUpFl_XMEUn9RIOYlKD2CvK2gB_T_Ql0bIC6STwBaEHYbZyn8dSIr-UTw3D2xq3u-rav9Tr4uCA';
	
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

	// Set the access token pulled above
	//spotifyApi.setAccessToken('BQAuj7GiXXo3jWJcTsHAeq5vVOkg4xq9w-3ziWC3wIqcAYS2NwtfcfmXERVyKQFOfodoSXCn170YRTZQZ2-s6Gb8TqwYZsdTMLklfsZ_JnBAsfUvx7tpChvDxvQ10iW594LDP4Yq4QBjE0va4gc5zprAZw3XwSw');

	/* Get Elvis' albums
	spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE').then(
		function(data) {
			console.log('Artist albums', data.body);
		},
		function(err) {
			console.error(err);
		}
	);*/

  
})
