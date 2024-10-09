<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/devinbergin/spot-thing">
    <img src="images/logo.png" alt="Logo" width="200">
  </a>

<h3 align="center">spot-thing</h3>

  <p align="center">
    A small player for spotify.
    <br />
    <a href="https://github.com/devinbergin/spot-thing/blob/main/images/spot-thing.gif?raw=true" target="_blank">View Demo</a>
    ·
    <a href="https://github.com/devinbergin/spot-thing/issues">Report Bug</a>
    ·
    <a href="https://github.com/devinbergin/spot-thing/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<p align="center">
  <img src="images/spot-thing.gif">
</p>

I built spot-thing to be the spotify mini player experience on desktop that I always wanted. I tried several that are available and none really hit the mark for me. I saw the release of Car Thing and it looked like the perfect UI for a mini player. Debated grabbing one and popping it on my desk but instead, I decided to dive into my first Electron/Node JS application and build it myself. Which only took over a year because of my hobby fixations. **IMPORTANT: Full functionality within spot-thing requires a spotify premium account**
<br>
<br>
Want to support me and spot-thing? [Buy Me A Coffee](https://www.buymeacoffee.com/devinbergin)

<p align="right">(<a href="#top">back to top</a>)</p>

### Built With

* [Electron](https://www.electronjs.org/)
* [Node.js](https://nodejs.org/)
* [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
* [Bootstrap](https://getbootstrap.com)
* [JQuery](https://jquery.com)
* [Font Awesome](https://fontawesome.com/)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- -->
## For Users
**spot-thing is free to use! You can download the latest version [here](https://github.com/devinbergin/spot-thing/releases/latest).**

After downloading the .exe file, place it somewhere you can access in the future, this is how you'll open spot-thing (or you can make a shortcut). Then follow the steps below. Note - If you used a previous version of spot-thing (pre v1.1) you will need to reenter your clientID and clientSecret upon downloading v1.1 or higher.

### Getting Setup

To use spot-thing, you need to setup your spotify developer account with a custom app. This will allow spot-thing to read information from your Spotify account such as now playing tracks.

1. Visit the Spotify Developer Dashboard below and login - [Spotfy Developer Dashboard](https://developer.spotify.com/dashboard/)

2. After logging in click the Create app button in the top right corner

<p align="center">
  <img height="400" src="setup/user-setup-1.png">
</p>

3. In the window that opens, fill in the App Name (spot-thing) and App Description (something you choose). You can place the github URL in the website box if you'd like, but it isn't required. Lastly in the Redirect URI box copy the following URL. Click Save once you're finished.

```sh
http://localhost:8888/callback
```

<p align="center">
  <img height="400" src="setup/user-setup-2.png">
</p>

4. The next page is the dashboard for your new app! Click the Settings button in the upper right.

<p align="center">
  <img height="400" src="setup/user-setup-3.png">
</p>

5. Here you will find your clientID and clientSecret values. Click view client secret to see both values. You will need to copy and paste these into spot-thing in the next step.

<p align="center">
  <img height="300" src="setup/user-setup-4.png">
</p>

7. Now open spot-thing! 

8. You'll be prompted to enter your Client ID and Client Secret, then click Next. 

<p align="center">
  <img height="250" src="setup/user-setup-5.png">
</p>

9. When you click next, spot-thing will attempt to automatically open an authorization URL for you in another window. This page is where you accept the permissions that spot-thing needs to read and control your playback details.

<p align="center">
  <img height="500" src="setup/user-setup-6.png">
</p>

10. After you click AGREE, spot-thing will receive authorization details from spotify and begin attempting to connect.

<p align="center">
  <img height="250" src="setup/user-setup-7.png">
</p>

11. You're done! If you have music currently playing on your spotify account you'll see spot-thing snap into action. If you don't have anything playing, you'll see a message from spot-thing to begin playing music on your main spotify app. spot-thing automatically stays connected to your account so you can close/open it as you need and you won't have to enter those details again. If for some reason it prompts you for the ID and Secret, just follow steps 8-11 again. 

<!-- GETTING STARTED -->
## For Developers

To get a local copy up and running follow these steps.

### Prerequisites

* NodeJS - Visit https://nodejs.org/en/download/ to get it installed
* Git - Visit https://git-scm.com/downloads to get it installed
* Spotify Premium Account

### Setup

To utilize the app you will need to create a Spotify App inside your Spotify Developer Dashboard. Follow the steps above for users.


### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/devinbergin/spot-thing.git
   ```
2. Move into the new directory
   ```sh
   cd spot-thing
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Start the App!
   ```sh
   npm start
   ```
5. Enter your spotify app details in the forms. Once complete, begin playing your media from your main spotify controller.


<p align="right">(<a href="#top">back to top</a>)</p>


<!-- USAGE EXAMPLES -->
## Usage

Coming soon.

### Working with scss

This project utilizes node-sass and scss files for compiled css. You will find several scss files containing the css code. 
- spot-thing.scss
- variables.scss
- fonts.scss
- style.scss

From a bash terminal, cd into he spot-thing folder and run this command
```sh
npm run scss
```

This will recompile the CSS file for you on each save while developing locally. 

You can also run a command to build the css if you prefer to use a minified version
```sh
npm run build-css
```

<p align="right">(<a href="#top">back to top</a>)</p>

### Building the app
```sh
npm run dist
```

### spotify-web-api-node
It doesn't appear that this natively supports getting podcast episode information in `getMyCurrentPlayingTrack` so I updated it to include the querystring `?additional_types=episode` in the request URL on line 1011 of `spotify-web-api.js` and now podcasts work. 
