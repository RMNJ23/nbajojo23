// Load environment variables
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL;

// ✅ Check for DB_URL
if (!DB_URL) {
    console.error("❌ ERROR: DB_URL is missing from .env file");
    process.exit(1);
}

// ✅ MongoDB Connection
mongoose
    .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ✅ Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecretkey",
        resave: false,
        saveUninitialized: false,
    })
);

// Flash messages
app.use(flash());

// Pass flash + session to all views
app.use((req, res, next) => {
    res.locals.message = req.flash("message");
    res.locals.username = req.session.username;
    next();
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.flash("message", "Please fill all fields");
        return res.redirect("/signup");
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash("message", "Username already exists");
            return res.redirect("/signup");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log("✅ New user registered:", username);
        req.flash("message", "Account created successfully. Please log in.");
        res.redirect("/");
    } catch (err) {
        console.error("❌ Signup error:", err);
        req.flash("message", "Error creating account");
        res.redirect("/signup");
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            req.flash("message", "Invalid username or password");
            return res.redirect("/");
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            req.flash("message", "Invalid username or password");
            return res.redirect("/");
        }

        // Store user in session
        req.session.username = username;
        console.log("✅ User logged in:", username);
        res.redirect("/dashboard");
    } catch (err) {
        console.error("❌ Login error:", err);
        req.flash("message", "Something went wrong");
        res.redirect("/");
    }
});

// ✅ Protected Dashboard Route


app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('dashboard', { user: req.session.user });
});


app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Error destroying session:", err);
            return res.redirect("/dashboard");
        }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});


// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
