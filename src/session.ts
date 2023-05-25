import { GetTokenResult } from "./api";
import { Challenge, Challenge1, Challenge3, Challenge4 } from "./challenge";
import http from "./http";
import util from "./util";

export interface TokenInfo {
    token: string;
    r: string;
    metabgclr: string;
    mainbgclr: string;
    guitextcolor: string;
    metaiconclr: string;
    meta_height: string;
    meta_width: string;
    meta: string;
    pk: string;
    dc: string;
    at: string;
    cdn_url: string;
    lurl: string;
    surl: string;
    smurl: string;
    // Enable keyboard biometrics
    kbio: boolean;
    // Enable mouse biometrics
    mbio: boolean;
    // Enable touch biometrics
    tbio: boolean;

    challenge_url_cdn: string;
}

export interface SessionOptions {
    userAgent?: string;
    proxy?: string;
}

let parseToken = (token: string): TokenInfo =>
    Object.fromEntries(
        token
            .split("|")
            .map((v) => v.split("=").map((v) => decodeURIComponent(v)))
    );

export class Session {
    public token: string;
    public tokenInfo: TokenInfo;
    private tokenRaw: GetTokenResult;
    private userAgent: string;
    private proxy: string;
    
    constructor(
        token: string | GetTokenResult,
        sessionOptions?: SessionOptions
    ) {
        if (typeof token === "string") {
            this.token = token;
        } else {
            this.token = token.token;
            this.tokenRaw = token;
        }
        if (!this.token.startsWith("token="))
            this.token = "token=" + this.token;

        this.tokenInfo = parseToken(this.token);
        this.tokenInfo.mbio = typeof(token) !== "string" ? token.mbio ?? false : false
        this.userAgent = sessionOptions?.userAgent || util.DEFAULT_USER_AGENT;
        this.proxy = sessionOptions?.proxy;
    }

    async getChallenge(): Promise<Challenge | null> {
        const requestData = {
            token: this.tokenInfo.token,
            sid: this.tokenInfo.r,
            render_type: "canvas",
            lang: "",
            isAudioGame: undefined,
            analytics_tier: this.tokenInfo.at,
            apiBreakerVersion: undefined
        }

        if (this.tokenRaw && this.tokenRaw.challenge_url_cdn.includes('game_core')) {
            requestData.apiBreakerVersion = "green"
            requestData.isAudioGame = false
        } else {
            requestData["data%5Bstatus%5D"] = "init"
        }

        let res = await http(
            this.tokenInfo.surl,
            {
                path: "/fc/gfct/",
                method: "POST",
                body: util.constructFormData(requestData),
                headers: {
                    "User-Agent": this.userAgent,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Sec-Fetch-Site": "same-origin",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Dest": "empty",
                    "Origin": this.tokenInfo.surl,
                    "Referer": this.getEmbedUrl(),
                    "X-Requested-With": "XMLHttpRequest",
                    "X-NewRelic-Timestamp": Date.now().toString()
                },
            },
            this.proxy
        );

        let data = JSON.parse(res.body.toString());
        data.token = this.token;
        data.tokenInfo = this.tokenInfo;

        if (data.error === "DENIED ACCESS") {
            // Do not need to solve challenge
            return null;
        }

        if (data.game_data.gameType == 1) {
            return new Challenge1(data, {
                proxy: this.proxy,
                userAgent: this.userAgent,
            });
        } else if (data.game_data.gameType == 3) {
            return new Challenge3(data, {
                proxy: this.proxy,
                userAgent: this.userAgent,
            });
        } else if (data.game_data.gameType == 4) {
            return new Challenge4(data, {
                proxy: this.proxy,
                userAgent: this.userAgent,
            });
        } else {
            throw new Error(
                "Unsupported game type: " + data.game_data.gameType
            );
        }
        //return res.body.toString()
    }

    getEmbedUrl(): string {
        //https://client-api.arkoselabs.com/fc/assets/ec-game-core/game-core/1.12.0/standard/index.html
        return `${this.tokenInfo.surl}/fc/assets/ec-game-core/game-core/1.12.0/standard/index.html?${util.constructFormData(
            this.tokenInfo
        )}`;
    }
}
