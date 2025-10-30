if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL;

// ✅ MongoDB connection
mongoose
    .connect(DB_URL)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware setup
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(
    session({
        secret: "supersecret",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(flash());

// ✅ Global flash messages
app.use((req, res, next) => {
    res.locals.message = req.flash("message");
    next();
});

// ✅ Routes
app.get("/", (req, res) => {
    res.render("index", { message: res.locals.message });
});

app.get("/signup", (req, res) => {
    res.render("signup", { message: res.locals.message });
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.flash("message", "Please fill in all fields.");
        return res.redirect("/signup");
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash("message", "Username already exists.");
            return res.redirect("/signup");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        req.flash("message", "Signup successful! Please log in.");
        res.redirect("/");
    } catch (error) {
        console.error("❌ Signup error:", error);
        req.flash("message", "Error creating account.");
        res.redirect("/signup");
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            req.flash("message", "Invalid username or password.");
            return res.redirect("/");
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            req.flash("message", "Invalid username or password.");
            return res.redirect("/");
        }

        req.session.user = user;
        res.redirect("/dashboard");
    } catch (error) {
        console.error("❌ Login error:", error);
        req.flash("message", "Something went wrong. Please try again.");
        res.redirect("/");
    }
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        req.flash("message", "Please log in first.");
        return res.redirect("/");
    }

    res.render("dashboard", { username: req.session.user.username });
});

// Logout Route (POST)
app.post("/logout", (req, res) => {
    // Destroy the user session (log the user out)
    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Logout error:", err);
            // If something goes wrong, stay on the dashboard
            return res.redirect("/dashboard");
        }
        // If logout succeeds, redirect to the homepage or login page
        res.redirect("/");
    });
});

app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
);
