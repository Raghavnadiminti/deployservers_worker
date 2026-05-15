

const axios = require("axios");

async function getPublicIP() {

    const tokenRes = await axios.put(
        "http://169.254.169.254/latest/api/token",
        {},
        {
            headers: {
                "X-aws-ec2-metadata-token-ttl-seconds": "21600"
            }
        }
    );

    const token = tokenRes.data;

  
    const ipRes = await axios.get(
        "http://169.254.169.254/latest/meta-data/public-ipv4",
        {
            headers: {
                "X-aws-ec2-metadata-token": token
            }
        }
    );

    return ipRes.data;
}
module.exports=getPublicIP