# Starling Home Hub Google Nest Bridge
This plugin will use your Starling Home Hubs Developer API Key and use it to grab the devices from the hub and add them to scrypted.
It currently only supports Nest Cams with WebRTC support, for now the supportd devices are written below. Thermostat support is being worked on in the nightly build of the plugin. 

Disclaimer:
This plugin is in beta development and is NOT complete, the discover devices feature has NOT been implemented [#2](https://github.com/tealtwo/starling-nest-bridge-scrypted/issues/2). It will be implemented soon but for right now you have the follow the instructions to get your device ID. 

Requirements:
1. Working Scrypted Server (With Scrypted Cloud although not required)
2. Nest Cams (See Supported Models)
3. Starling Home Hub (with developer API enabled)

Enable Starlings API: 
1. Go to your Starling Home Hubs dashboard and wait for it to load, on the bottom you will see "Starling Developer Connect".
2. Go ahead and enable this, your hub will retstart.
3. Once enabled create an API key with all permissions, and you can use that API key for this plugin.
4. MAKE SURE TO USE HTTP NOT HTTPS! THIS IS LOCAL THERE IS NO SECURITY RISK WHEN USING HTTP!

Installation Instruction:
1. Clone the project using Git or "Download ZIP" from the master branch.
2. Extract the project and open the folder in VSC (Visual Studio Code).
3. In .vscode open "settings.json" and change the IP address to YOUR local scrypted servers IP address.
4. On the Left Bar click on the Triangle with the bug next to it.
5. On the top you will see "RUN" and a green trianle next to "Scrypted Debugger", note how you got to that.
6. In "src" you will open "main.js" and then at the top you will see two variables, deviceId and apiKey.
7. In apiKey you will put your Starling Developer Connect API key (with full permissions) inside the quotes, without any spaces.
8. To get your deviceId you will copy this command and replace "apiKey" with your api key from your starling home hub, and "ipaddress" with your hubs local IP. "http://ipaddress:3080/api/connect/v1/devices?key=apiKey"
9. Replace "http://hubAddress:3080" with http://yourhubsipaddress:3080, if you do not you will not be sending the API calls to your hub and the plugin nor your cameras will work. You have to put in your hubs LOCAL IP address. If you don't know what a local IP is you really shouldn't be doing this.
10. once you have modified the main.js file with your deviceId and apiKey you can then save it and press the green triangle you noted 
earlier, it MIGHT fail the first time with some red text along with the IP address of your scrypted server, if this happens just press the button again and it should work.
11. I will note here that you may have to run a command, if you do the console will tell you to run a command, if you do it would be npx scrypted login ipaddress, once your run that it will prompt you to enter your scrypted login details.
12. Once you have ran the debugger you can go back to your Scrypted Console and the plugin along with the device should have popped up.
13. That's it the plugin is now installed!

Supported Devices:
- Nest Cam Indoor/Outdoor (Battery) - 2021
- Nest Cam Outdoor With Floodlight (Battery) - 2021
- Nest Cam Indoor (Wired) - 2021
- Nest Doorbell (Battery) - 2021***
- Nest Doorbell (Wired) - 2022
- Nest Camera Indoor - 2016 (Legacy)**
- Nest Camera Outdoor - 2016 (Legacy)**
- Nest Camera IQ Indoor - 2017 (Legacy)**
- Nest Camera IQ Outdoor - 2017 (Legacy)**

Nightly Support: 
- Nest Learning Thermostat 3rd Gen - 2015
- Nest Thermostat E - 2017
- Nest Thermostat 1st Gen - 2020
- Nest Learning Thermostat 4th Gen - 2024

Legacy Camera Users:
If you are using a Legacy Nest Camera (marked above), unless you migrate your camera to the Google Home App for WebRTC support your camera will use RTSP which is NOT supported. You HAVE to migrate your camera to the Goolge Home App so it updates to use WebRTC and Starlings SDC Local API Can be used with them. RTSP is not supported [#1](https://github.com/tealtwo/starling-nest-bridge-scrypted/issues/1)

HomeKit Users:
Why in the flying fish are you using this plugin to add your Nest Cam to HomeKit when the entire purpose of the Starling Home Hub to begin with was that you can add your Google Nest Cameras to HomeKit, adding it to HomeKit this way is a BAD idea, it will add unnecessary load to your Scrypted Server, along with adding latency. 

Google Home Users:
..., read notes.

NOT Supported:
- Nest Hello (Battery/Wired 2018) - No Support Planned (RTSP) - Check [#1](https://github.com/tealtwo/starling-nest-bridge-scrypted/issues/1)
- Nest Hub Max (Camera) - No Support Planned (RTSP) - Check [#1](https://github.com/tealtwo/starling-nest-bridge-scrypted/issues/1)
 
** = This plugin doesn't actually have year limitations, it actually supports any Nest Cam that supports the WebRTC protocol. Instead of identifying the the year or model of the camera it will simply do a WebRTC camera handshake.
*** = I have done testing on this doorbell and if you plan to use it with Scrypted NVR, (or Home Assistant Via Scrypted NVR) the battery in this doorbell will die in roughly a day or two, it is not designed for constant streaming as it mainly runs on battery power and only trickle charges IF it is wired. Do NOT use this doorbell with NVR, there are no issues with HomeKit or Alexa support though, they will work. (or Google Home but these are Google Nest Cams so don't know why you would want that. )
[Side Note, I don't know if Google uses local RTC streaming if your on the same network as your cams but I know that this plugin will, and if Google goes through the Cloud even for local streaming this plugin would be better than the Native Google Home App]