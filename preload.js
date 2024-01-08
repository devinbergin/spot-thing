window.addEventListener('DOMContentLoaded', () => {
	// For storing client data
	const Store = require('electron-store');
	const store = new Store();
	var debug = store.get('debug');

	const ipc = window.require('electron').ipcRenderer;

	// jquery
	const $ = require('jquery');
	window.jQuery = window.$ = $;

	// Spotify api
	const SpotifyWebApi = require('spotify-web-api-node');

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

	// Declare some globals
	var spotifyApi;

	// Check if the config.json already exists with the details we need in it
	if (store.get('accessToken') && store.get('refreshToken')) {
		// If found, we refresh the access token and then run the normal startIntervals
		debug && console.log("accessToken:", store.get('accessToken'));
		debug && console.log("refreshToken:", store.get('refreshToken'));
		debug && console.log("clientID:", store.get('clientID'));
		debug && console.log("clientSecret:", store.get('clientSecret'));
		debug && console.log("redirectURI:", store.get('redirectURI'));

		// Set credentials to pass over
		var credentials = {
			clientId: store.get('clientID'),
			clientSecret: store.get('clientSecret'),
			redirectUri: store.get('redirectURI')
		};

		debug && console.log('credentials: ' + JSON.stringify(credentials));

		spotifyApi = new SpotifyWebApi(credentials);
		spotifyApi.setAccessToken(store.get('accessToken'));
		spotifyApi.setRefreshToken(store.get('refreshToken'));

		// Refresh the access token that we found
		spotifyApi.refreshAccessToken().then(
			function(data) {
				debug && console.log('The access token has been refreshed!');
		
				// Save the access token so that it's used in future calls
				spotifyApi.setAccessToken(data.body['access_token']);

				// Store the updated access token
				store.set('accessToken', data.body['access_token'])

				// Start the intervals
				startIntervals(store.get('refreshToken'));
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
	};

	// First registration form
	$("#idSecretNext").click(function() {		
		// Check if the fields are filled out
		if ($('#idSecretForm')[0].checkValidity() == false) {
			$('#idSecretForm')[0].reportValidity()
		} else {
		
			// Get the secrets
			clientID = $('#clientIDInput').val();
			clientSecret = $('#clientSecretInput').val();
			redirectURI = 'http://localhost:8888/callback';

			debug && console.log('storing clientID: ' + clientID);
			debug && console.log('storing clientSecret: ' + clientSecret);
			debug && console.log('storing redirectURI: ' + redirectURI);

			// Store the secrets
			store.set('clientID', clientID);
			store.set('clientSecret', clientSecret);
			store.set('redirectURI', redirectURI);

			var scopes = ['user-read-currently-playing','user-read-playback-position','user-modify-playback-state','user-read-playback-state','user-library-read','user-library-modify'],
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

			// Send the authorization URL back to main.js to open in a new electron window
			ipc.send('createAuthWindow', [authorizeURL]);

			// Hide the first form and unhide the second one
			$('#idSecret').hide();
			$('#loading').show();

			// Check every 1s to see if we have set the authWindowURL from main.js
			var waitForAuth = window.setInterval(function(){
				if (store.get('authWindowURL')) {
					// Stop checking and start activation process
					clearInterval(waitForAuth);
					urlCodeActivate();
				}
			}, 1000);
		}
	});

	// Process the authWindowURL once it comes back from main.js
	function urlCodeActivate() {		
		// Parse the URL to find the code value
		var authWindowURL = store.get('authWindowURL')
		var authWindowURLString = authWindowURL.toString();
		var queryStringVal = authWindowURLString.split('?')[1]
		var parsed = queryString.parse(queryStringVal);
		var authCode = parsed.code;

		debug && console.log('authWindowURL: ' + authWindowURL);
		debug && console.log('authWindowURLString: ' + authWindowURLString);
		debug && console.log('queryStringVal: ' + queryStringVal);
		debug && console.log('authCode: ' + authCode);

		// Store the authCode 
		store.set('authCode', authCode);

		// Call the authorize function below and pass the authCode over
		authorizeSpot(authCode);
	};	

	function authorizeSpot(code) {				
		// Set credentials to pass
		var credentials = {
			clientId: store.get('clientID'),
			clientSecret: store.get('clientSecret'),
			redirectUri: store.get('redirectURI')
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

				// Store the tokens
				store.set('accessToken', data.body['access_token']);
				store.set('refreshToken', data.body['refresh_token']);

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
					debug && console.log('Repeat State (track/context/off): ' + data.body.repeat_state);

					// Store some now playing info for use elsewhere
					store.set('trackID', data.body.item.id);

					// Get album artwork color
					var url = data.body.item.album.images[0].url;
					request({ url, encoding: null }, (err, resp, buffer) => {
						color.getAverageColor(buffer).then(color => {
							debug && console.log('Album Color: '+color.hex);

							// Set the UI colors from the album artwork
							$('.titlebar').css('background',shader(color.hex, -.1));
							$('.dropdown-menu').css('background-color',shader(color.hex, -.1));
							$('.info').css('background',shader(color.hex, -.1));
							$('.controls').css('background',shader(color.hex, -.4));
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
					var repeat_state = data.body.repeat_state;

					playing = playing.toString();
					shuffle = shuffle.toString();
					repeat_state = repeat_state.toString();
					store.set('repeat_state', repeat_state);

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

					// Set the repeat toggle
					if (repeat_state == 'track') {
						$('#repeatSong').addClass('repeatActive');
						$('#repeatSong').removeClass('repeatInactive');
						$('.repeat-track').show();
					} else if (repeat_state == 'context') {
						$('#repeatSong').addClass('repeatActive');
						$('#repeatSong').removeClass('repeatInactive');
						$('.repeat-track').hide();
					} else {
						$('#repeatSong').removeClass('repeatActive');
						$('#repeatSong').addClass('repeatInactive');
						$('.repeat-track').hide();
					}

					// Check if the current track is saved to their library
					spotifyApi.containsMySavedTracks([data.body.item.id]).then(function(data) {
						// An array is returned, where the first element corresponds to the first track ID in the query
						var trackSaved = data.body[0];
						if (trackSaved) {
							$('#saveSong').addClass('saved');
							$('#saveSong').removeClass('fa-regular').addClass('fa-solid');

							debug && console.log('Track was found in the users Your Music library.');
						} else {
							$('#saveSong').removeClass('saved');
							$('#saveSong').addClass('fa-regular').removeClass('fa-solid');

							debug && console.log('Track was not found in the users Your Music library.');
						}
					}, function(err) {
						debug && console.log('Something went wrong in containsMySavedTracks!', err);
					});
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

					// Update the saved tokens
					store.set('accessToken', data.body['access_token']);
					store.set('refreshToken', refreshToken);
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

	$("#saveSong").click(function() {
		var trackID = store.get('trackID');

		spotifyApi.containsMySavedTracks([trackID]).then(function(data) {
			// An array is returned, where the first element corresponds to the first track ID in the query
			var trackSaved = data.body[0];
			if (trackSaved) {
				// The track is already saved so remove it from their saved library
				spotifyApi.removeFromMySavedTracks([trackID]);

				// Display it as removed now
				$('#saveSong').removeClass('saved');
				$('#saveSong').addClass('fa-regular').removeClass('fa-solid');

				debug && console.log('Track was removed from the users library.');
			} else {
				// The track is not in their saved library so add it
				spotifyApi.addToMySavedTracks([trackID]);

				// Display it as saved now
				$('#saveSong').addClass('saved');
				$('#saveSong').removeClass('fa-regular').addClass('fa-solid');

				debug && console.log('Track was added to the users library');
			}
		})
		.catch(function(err) {
			debug && console.log('Something went wrong in #saveSong!', err);
		});
	});

	// Repeat track/playlist button
	$("#repeatSong").click(function() {
		var repeat_state = store.get('repeat_state');
		var repeat_key;

		if (repeat_state == 'off') {
			// Set it to context
			repeat_key = 'context'
			$('#repeatSong').addClass('repeatActive');
			$('#repeatSong').removeClass('repeatInactive');
			$('.repeat-track').hide();
		} else if (repeat_state == 'context') {
			// Set it to track
			repeat_key = 'track';
			$('#repeatSong').addClass('repeatActive');
			$('#repeatSong').removeClass('repeatInactive');
			$('.repeat-track').show();
		} else {
			// Set it to off
			repeat_key = 'off';
			$('#repeatSong').removeClass('repeatActive');
			$('#repeatSong').addClass('repeatInactive');
			$('.repeat-track').hide();
		}

		spotifyApi.setRepeat(repeat_key).then(function () {
			debug && console.log('Set repeat_state to: ' + repeat_key);
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

	// Show reset config popup
	$('#resetConfig').click(function() {
		$('#config').show();
	});

	// Show reset config from loading
	$('#configBtnLoading').click(function() {
		$('#config').show();
	});

	// Close config overlay
	$('#configClose').click(function() {
		$('#config').hide();
	});

	// Reset Config button to erase their setup and let them start fresh
	$('#configConfirm').click(function() {
		debug && console.log('Removing configuration files.')

		// Clears out the config.json file of all values
		store.clear();

		// Reload the app
		location.reload();
	});

	// Open the explore overlay
	$('#exploreLink').click(function() {
		spotifyApi.getFeaturedPlaylists({ limit : 8, offset: 0, country: 'US', locale: 'en_US'})
		.then(function(data) {
			for (var x=0; x < data.body.playlists.items.length; x++) {
				$('#explorePlaylist_' + x + ' img').attr('src',data.body.playlists.items[x].images[0].url);
			}

			debug && console.log('getFeaturedPlaylists: ' + JSON.stringify(data.body));
		}, function(err) {
			debug && console.log("Something went wrong in getFeaturedPlaylists!", err);
		});

		$('#explorePlaylists').show();
	});

	// Close explore trending playlists overlay
	$("#close-explore").click(function() {
		$('#explorePlaylists').hide();
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

	// Close the app
	$('#close-button').click(function() {
		window.close();
	});
  
});