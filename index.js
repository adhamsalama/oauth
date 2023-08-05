import fs from "fs/promises";
import express from "express";
import cors from "cors";
import axios from "axios";
import jwt from "jsonwebtoken";
import "dotenv/config";

const creds = {};

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  const html = await fs.readFile("./views/index.html", "utf8");
  return res.send(html);
});
app.get("/signup", async (req, res) => {
  const html = await fs.readFile("./views/signup.html", "utf8");
  return res.send(html);
});

app.post("/login", async (req, res) => {
  const { code } = req.body;
  console.log({ code });
  // Make a POST request to the Google Authorization Server
  const accessToken = await axios
    .post("https://oauth2.googleapis.com/token", {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "http://localhost:3000/callback",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: "email", // https://www.googleapis.com/auth/userinfo.email openid
    })
    .then((response) => {
      // Handle the response
      const accessToken = response.data.access_token;
      // Use the access token to make API requests
      return accessToken;
    })
    .catch((error) => {
      // Handle errors
      console.log("Something went wrong", error);
    });
  console.log({ accessToken });
  const userData = await axios
    .get("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .catch((error) => {
      console.log("Something else wnet wrong", error);
    });
  const token = jwt.sign({ ...userData.data }, process.env.JWT_SECRET);
  return res.json({ token });
});

// frontend
app.get("/callback", async (req, res) => {
  console.log({ query: req.query, body: req.body });
  const userHtml = await fs.readFile("./views/user.html", "utf8");
  return res.send(userHtml);
});

app.listen(3000, () => console.log("Running at port 3000"));
