// Project Authored By Teal Lvbs LLC.
const { ScryptedDeviceBase, RTCSignalingSession, ScryptedInterface } = require('@scrypted/sdk');
const axios = require('axios');
const { connectRTCSignalingClients } = require('/Users/T/Documents/JetBrains/VSC/scrypted-main/common/src/rtc-signaling.ts');
//The DeviceId and ApiKey for your Nest Camera & Starling Home Hub. Need to implement the "Setting" implement so you can edit these values from the Scrypted Web GUI without having to modify the code in any capacity (or we will just need ApiKey & DeviceId will auto popuplate when the autoDiscoverDevices function is properly impemented & works, issue #3 https://github.com/tealtwo/starling-nest-bridge-scrypted/issues/3)
const deviceId = "DeviceId";
const apiKey = "ApiKey";
const hubAddress = "http://hubAddress:3080";
//This function controls the RTC Session for the Nest Cams Streams by Starting, Stopping, Or Extending them. As an example, if your a Scrypted NVR user since that records 24/7 when the plugin starts it will request a StreamId from the Starling Hub which it will respond with one from the camera that you requested it from (camera comes from DeviceId), given the ApiKey is valid ofcourse. Once that StreamId has been recieved and is in use it will expire after two minutes, unless it is extended using the "extendSession" function. This function will send a API request to the Starling Hub which will renew the StreamId's validity by another 2 minutes, and since we extend every minute it will never expire unless the server is restarted or the camera goes offline in which case when it comes back online it will request a new StreamId and the cycle will repeat. If a HomeKit client also request to stream from the same device a NEW StreamId will be generated and will be extended until the HomeKit client disconnects, at which point the StreamId will be terminated using the "endSession" function, while also having the NVR StreamId renewing and recording/streaming in the background. 
class NestRTCSessionControl {
    constructor(camera, options) {
        this.camera = camera;
        this.options = options;
        this.refreshAt = Date.now() + 4 * 60 * 1000;
    }
    async setPlayback(options) {
        this.audio = options.audio || false; 
        this.video = options.video || false; 
    }
    async getRefreshAt() {
        return this.refreshAt;
    }
    async extendSession() {
        const streamId = this.options.streamId; 
        const result = await fetch(`${hubAddress}/api/connect/v1/devices/${deviceId}/stream/${streamId}/extend?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });
        const json = await result.json();
        const extensionresult = atob(json.extensionresult); 
        this.refreshAt = Date.now() + 4 * 60 * 1000; 
    }
    async endSession() {
        const streamId = this.options.streamId; 
        await fetch(`http://${hubAddress}/api/connect/v1/devices/${deviceId}/stream/${streamId}/stop?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8' 
            }
        })
    }
}
//This class is the actual "camera" itself, or well more like an RTCBridge as its in is name, go to "Notes.MD" for more details on why it is this way.
class StarlingNestRTCBridge extends ScryptedDeviceBase {
    constructor() {
        super();
        this.console.log('Starling Home Hub Bridge:');
        this.initialize();
    }
    async initialize() {
        this.console.log('Initializing Starling Home Hub Bridge...');
    }
    getWebRTCIceServers() {
        return [
            { urls: 'stun:stun.l.google.com:19302' }
        ];
    }
    //This function is the "blueprint" to create the offerSdp to send the Nest Cam
    async createNestOfferSetup() {
        return {
            type: 'offer',
            audio: {
                direction: 'sendrecv',
            },
            video: {
                direction: 'recvonly',
            },
            datachannel: {
                label: 'dataSendChannel',
                dict: {
                    id: 1,
                },
            },
        };
    }
    //This function does the Sdp creation and response, along with the StreamId, it uses the offerSdp "blueprint" from the above function
    async startRTCSignalingSession(session) {
        this.console.log('Plugin Initialized!');
        this.console.log('DEBUG: OFFER SETUP LOG:', await this.createNestOfferSetup());
        let answer;
        let streamId;
        const options = {
            requiresOffer: true,
            disableTrickle: true,
        };
        const answerSession = {
            __proxy_props: { options },
            options,
            createLocalDescription: async (type, setup, sendIceCandidate) => {
                if (type !== 'answer') {
                    throw new Error('Google Camera only supports RTC answer');
                }
                if (sendIceCandidate) {
                    throw new Error('Does not support trickle!');
                }
                return { type: 'answer', sdp: answer };
            },
            setRemoteDescription: async (description, setup) => {
                try {
                  if (!description || !description.sdp) {
                    this.console.error('SDP not found in the description object. Description:', description);
                    throw new Error('Invalid SDP description.');
                  }
                  const decodedOffer = description.sdp.replace('a=ice-options:trickle\r\n', '')
                    .replace('sendrecv', 'recvonly');
                  const data = decodedOffer;
                  const offerSdp = Buffer.from(data).toString('base64');
                  this.console.log('Sending offer SDP:', offerSdp);
                  const result = await fetch(`${hubAddress}/api/connect/v1/devices/${deviceId}/stream?key=${apiKey}`, {
                    method: 'POST',
                    body: JSON.stringify({ offer: offerSdp }),
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' }
                });
                  if (!result.ok) {
                    throw new Error(`Network response was not ok: ${result.statusText}`);
                  }
                  const json = await result.json();
                  if (!json.answer) {
                    throw new Error('Invalid response: missing "answer" field.');
                  }
                  answer = Buffer.from(json.answer, 'base64').toString('utf-8');
                  streamId = json.streamId;
                  this.console.log('DEBUG LOGS: (STREAMID)', streamId);
                  this.console.log('DEBUG LOGS (ANSWER):', answer);
                  await session.setRemoteDescription({ type: 'answer', sdp: answer });
                  return { sdp: answer, type: 'answer' };
                } catch (error) {
                  this.console.error('Error in setRemoteDescription:', error);
                  throw new Error('Failed to set remote description.');
                }
            },
            addIceCandidate: async (candidate) => {
                throw new Error("Google Camera does not support trickle ICE");
            },
            getOptions: async () => {
                return options;
            }
        };
        //This "try" function is what actually does the handshake between the WebRTC plugin and the Nest Camera, it will give the StreamId, and AnswerSdp (which has been decoded from Base64) to the WebRTC plugin which it can then use to stream the camera.
        try {
            await connectRTCSignalingClients(this.console, session, await this.createNestOfferSetup(), answerSession, {});
        } catch (error) {
            this.console.error('Error connecting RTC signaling clients:', error);
            throw new Error('Failed to connect RTC signaling clients.');
        }
        return new NestRTCSessionControl(this, { streamId });
    }
    //This is the auto device discovery function, which while is here is not implemented or used in any way yet. It will be implemented soon along with auto device creation. Issue #2 https://github.com/tealtwo/starling-nest-bridge-scrypted/issues/2
    async discoverDevices() {
        try {
            this.console.log('Discovering devices...');
            const response = await fetch(`${hubAddress}/api/connect/v1/devices?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=UTF-8' }
            });
            const json = await response.json();
            const devices = json.results;
            this.console.log('Devices discovered:', devices);
            return devices;
        } catch (error) {
            this.console.error('Error discovering devices:', error);
            throw new Error('Failed to discover devices.');
        }
    }
}
export default StarlingNestRTCBridge;
//Project Authored By Teal Lvbs