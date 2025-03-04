// Optional test for roblox detection
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"

const undici = require("undici")
const funcaptcha = require("../lib")

/*
undici.request("https://auth.roblox.com/v2/signup", {
    method: "POST",
}).then(async res => {
    const csrf = res.headers["x-csrf-token"]

    const res2 = await undici.request("https://auth.roblox.com/v2/signup", {
        method: "POST",
        headers: {
            "x-csrf-token": csrf,
            "content-type": "application/json",
            "user-agent": USER_AGENT
        },
        body: JSON.stringify({
            "username": "",
            "password": "",
        })
    })
    const body = await res2.body.json()
    setTimeout(async () => {
        const fieldData = body.errors[0].fieldData.split(",")
        const token = await funcaptcha.getToken({
            pkey: "A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F",
            surl: "https://roblox-api.arkoselabs.com",
            data: {
                "blob": fieldData[1],
            },
            headers: {
                "User-Agent": USER_AGENT,
            },
            site: "https://www.roblox.com",
        })
    
        let session = new funcaptcha.Session(token, {
            userAgent: USER_AGENT,
        })
        let challenge = await session.getChallenge().catch((err) => console.log('signup fail', err))
    
        console.log("Signup", challenge.data.game_data.game_variant, challenge.data.game_data.waves)
    
        if (
            challenge.data.game_data.game_variant && (
                challenge.data.game_data.game_variant.startsWith("dice_") ||
                challenge.data.game_data.game_variant.startsWith("dart") ||
                challenge.data.game_data.game_variant.startsWith("context-") ||
                [
                    "shadow-icons",
                    "penguins",
                    "shadows",
                    "mismatched-jigsaw",
                    "stairs_walking",
                    "reflection",
                ].includes(challenge.data.game_data.game_variant)
            )
        ) {
            console.log("Signup", "Test failed :(")
        } else {
            console.log("Singup", "Test passed!")
        }
    }, 2500)
})
*/


undici.request("https://auth.roblox.com/v2/login", {
    method: "POST",
}).then(async res => {
    const csrf = res.headers["x-csrf-token"]

    const res2 = await undici.request("https://auth.roblox.com/v2/login", {
        method: "POST",
        headers: {
            "x-csrf-token": csrf,
            "content-type": "application/json",
            "user-agent": USER_AGENT
        },
        body: JSON.stringify({
            "ctype": "Username",
            "cvalue": "Test",
            "password": "Test",
        })
    })
    const body = await res2.body.json()
    setTimeout(async () => {
        const fieldData = JSON.parse(Buffer.from(res2.headers["rblx-challenge-metadata"], "base64"))

        const token = await funcaptcha.getToken({
            pkey: "476068BF-9607-4799-B53D-966BE98E2B81",
            surl: "https://client-api.arkoselabs.com",
            data: {
                "blob": fieldData.dataExchangeBlob,
            },
            headers: {
                "User-Agent": USER_AGENT,
            },
            site: "https://www.roblox.com",
            location: "https://www.roblox.com/login"
        });

        console.log((token.token ? "" : "in") + "valid fingerprint", token);

        let session = new funcaptcha.Session(token, {
            userAgent: USER_AGENT,
        })
        let challenge = await session.getChallenge().catch((err) => {
            console.log('challenge fail', err);
        });

        if (!challenge) {
            let req = await undici.request("https://auth.roblox.com/v2/login", {
                method: "POST",
                headers: {
                    "x-csrf-token": csrf,
                    "content-type": "application/json",
                    "user-agent": USER_AGENT,
                    "rblx-challenge-id": res2.headers["rblx-challenge-id"],
                    "rblx-challenge-metadata": Buffer.from(JSON.stringify({
                        "unifiedCaptchaId": fieldData.unifiedCaptchaId,
                        "captchaToken": token.token,
                        "actionType": "Login"
                    })).toString("base64"),
                    "rblx-challenge-type": "captcha"
                },
                body: JSON.stringify({
                    "ctype": "Username",
                    "cvalue": "Test",
                    "password": "Test",
                })
            })
                    
            let json = await req.body.json();
            if (json.errors?.[0]?.code === 1) {
                console.log("Login", "Test passed! (no challenge issued / token generated)");
                return;
            }
        }

        console.log("Login", challenge.data.game_data.game_variant, challenge.data.game_data.waves)

        if (
            challenge.data.game_data.game_variant && (
                challenge.data.game_data.game_variant.startsWith("dice_") ||
                challenge.data.game_data.game_variant.startsWith("dart") ||
                challenge.data.game_data.game_variant.startsWith("context-") ||
                [
                    "shadow-icons",
                    "penguins",
                    "shadows",
                    "mismatched-jigsaw",
                    "stairs_walking",
                    "reflection",
                ].includes(challenge.data.game_data.game_variant)
            )
        ) {
            console.log("Login", "Test failed :(")
        } else {
            console.log("Login", "Test passed!")
        }
    }, 2500);

})

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"