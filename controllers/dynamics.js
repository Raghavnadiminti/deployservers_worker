const axios = require("axios");

async function getPublicIP() {
    const res = await axios.get(
        "http://169.254.169.254/latest/meta-data/public-ipv4"
    );

    return res.data;
}

module.exports=getPublicIP