import { Nvr } from "hikvision-isapi-client";
import dotenv from "dotenv";

dotenv.config();
let shouldStop = false;

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

    const channels = await nvr.getChannelStatus();
    const cameras = await nvr.fetchChannels();

    const logOfflineChannels = () => {
      const onlineChannels = channels
        .filter((channel) => channel.online === false)
        .map(({ ip, online }) => ({ ip, online }));
      if (onlineChannels.length > 0) {
        console.log(
          "Cameras status:",
          onlineChannels.length > 0
            ? () => {
                onlineChannels.forEach((channel) => {
                  const camera = cameras.find(
                    (cam) => cam.address === channel.ip,
                  );
                  console.log(
                    `Name camera offline - ${camera ? camera.name : channel.ip} (${channel.ip})`,
                  );
                });
              }
            : "All channels are online",
        );
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
      logOfflineChannels();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await nvr.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ NVR connection failed:", error.message);
  }
}

main();
