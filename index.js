import { Nvr } from "hikvision-isapi-client";
import dotenv from "dotenv";

dotenv.config();
let shouldStop = false;
let totalCameras = 0;
let offlineCamerasCount = 0;
const nvr = new Nvr({
  ip: process.env.NVR_IP,
  port: parseInt(process.env.NVR_PORT),
  user: process.env.NVR_USER,
  password: process.env.NVR_PASSWORD,
  version: parseInt(process.env.NVR_VERSION),
});

async function main() {
  try {
    await nvr.connect();
    console.log("✅ Connected to NVR");
    //    {
    //   id: 51,
    //   name: 'IAI#Kantor 03',
    //   addressType: 'ipaddress',
    //   address: '10.60.20.51',
    //   protocol: 'HIKVISION',
    //   managePort: 8000,
    //   inputPort: 1,
    //   userName: 'admin',
    //   streamType: 'auto',
    //   deviceId: '',
    //   enableAnr: false,
    //   enableTiming: true
    // }

    const cameras = await nvr.fetchChannels();
    totalCameras = cameras.length;
    const logOfflineChannels = async () => {
      const channels = await nvr.getChannelStatus();
      const offlineChannels = channels.filter((channel) => channel.online === false);
      
      if (offlineChannels.length > 0 && offlineChannels.length !== offlineCamerasCount) {
        offlineCamerasCount = offlineChannels.length;
        const messages = offlineChannels.map((channel) => {
          const camera = cameras.find((cam) => cam.address === channel.ip);
          return `Name camera offline - ${camera ? camera.name : channel.ip} (${channel.ip})`;
        });
        console.log("🕵️Cameras status:", messages);
        console.log("💀Total offline cameras:", offlineChannels.length);
        console.log("📷Total cameras:", totalCameras);
      }
    };


    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", (chunk) => {
        const key = chunk.toString().toLowerCase();
        if (key === "q") {
          console.log("🔔 OFF");
          shouldStop = true;
        }
      });
    }

    while (!shouldStop) {
      await logOfflineChannels();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await nvr.disconnect();
  } catch (error) {
    console.error("❌ NVR connection failed:", error.message);
  } finally {
    process.exit(0);
  }
}

main();
