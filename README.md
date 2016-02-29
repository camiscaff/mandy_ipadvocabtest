# LSCP iDevXXI App

This app is designed to perform experiments about language learning in babies. It will be composed of several mini games. For now, it's only one game, called Word Comprehension.

This app communicates with a back-office that receives and safely stores the experimental data.

* **Client**: [LSCP](http://www.lscp.net)
* **Targeted platform**: iPad with iOS 7.1 or newer

![Mandy](http://idevxxi.acristia.org/assets/mandy-hello-b3c05f337045d53c2c709f49598bcf43.png) *Say hi to Mandy!*

## Dependencies

* The backend should have been deployed on a web server to allow sync.
* Git
* Node and npm ([download](http://nodejs.org/download/))
* Bower `npm install -g bower`
* Gulp (will be installed by npm)

### Phonegap plugins used

You don't need to install them manually if you use Phonegap Build.

* [org.apache.cordova.device](https://build.phonegap.com/plugins/1178)
* [org.apache.cordova.file](https://build.phonegap.com/plugins/1164)
* [org.apache.cordova.file-transfer](https://build.phonegap.com/plugins/1177)

## Local development setup

* clone the repository
* `npm install`
* `bower install`
* define your configuration settings in `app/scripts/App.js`

Run `gulp watch` for in-browser development and test with livereload.

## Package and distribute

We do not package the app locally, but use [PhoneGap Build](http://build.phonegap.com) instead.

Run `gulp build`, which prepares the app for release and creates a zip archive (`app.zip`, in the project directory), then upload this archive to PhoneGap Build to package the app.

See [PhoneGap Build documentation](http://docs.build.phonegap.com) for more information.
