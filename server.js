const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database("job_listing.db", (err) => {
  if (err) console.error("Error connecting to database", err);
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS job_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    companyName TEXT NOT NULL,
    companyLogoUrl TEXT,
    jobPosition TEXT NOT NULL,
    monthlySalary INTEGER,
    jobType TEXT CHECK(jobType IN ('Internship', 'Full-Time', 'Part-Time', 'Contractual')),
    remote TEXT CHECK(remote IN ('Remote', 'In-Office')),
    location TEXT,
    jobDescription TEXT,
    aboutCompany TEXT,
    skillsRequired TEXT,
    additionalInfo TEXT,
    userId INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jobId) REFERENCES job_listings(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);
});

// Seed default user
const seedDefaultUser = () => {
  const defaultUser = {
    username: "admin",
    email: "admin@example.com",
    password: "password123", // This will be hashed
  };

  // Check if the users table is empty
  db.get(`SELECT COUNT(*) AS count FROM users`, (err, row) => {
    if (err) {
      console.error("Error checking users table:", err);
      return;
    }

    if (row.count === 0) {
      // Hash the password
      bcrypt.hash(defaultUser.password, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing password:", err);
          return;
        }

        // Insert the default user
        db.run(
          `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
          [defaultUser.username, defaultUser.email, hashedPassword],
          (err) => {
            if (err) {
              console.error("Error inserting default user:", err);
            } else {
              console.log("Default user added successfully.");
            }
          }
        );
      });
    }
  });
};

// Seed default job listings
const seedDefaultJobListings = () => {
  const defaultJobs = [
    {
      companyName: "Tech Innovators Inc.",
      companyLogoUrl: "https://logo.clearbit.com/amazon.com",
      jobPosition: "Frontend Developer",
      monthlySalary: 25000,
      jobType: "Full-Time",
      remote: "Remote",
      location: "Hyderabad",
      jobDescription: "We are looking for a skilled Frontend Developer to join our team. The ideal candidate will be responsible for developing user-facing features, ensuring high performance and responsiveness of the application.",
      aboutCompany: "Tech Innovators Inc. provides technology-based services to help businesses and organizations achieve their goals. We offer a wide range of services, including software development, system integration, network and security services, cloud computing, and data analytics. Our primary focus is on leveraging technology to streamline business processes, improve productivity, and enhance overall efficiency.",
      skillsRequired: "HTML5, CSS, JavaScript, React, Angular, Vue.js",
      additionalInfo: "Experience with responsive design and cross-browser compatibility is a plus.",
      userId: 1,
    },
    {
      companyName: "Cloud Solutions Ltd.",
      companyLogoUrl: "https://logo.clearbit.com/cloudsolutions.com",
      jobPosition: "Backend Developer",
      monthlySalary: 36000,
      jobType: "Full-Time",
      remote: "Remote",
      location: "Mumbai",
      jobDescription: "We are seeking a Backend Developer to design, implement, and manage server-side logic. The candidate will work on optimizing database interactions and ensuring high performance and responsiveness.",
      aboutCompany: "Cloud Solutions Ltd. specializes in providing cloud infrastructure services to businesses worldwide. We help organizations migrate to the cloud, optimize their cloud environments, and ensure data security and compliance.",
      skillsRequired: "Node.js, Python, Java, SQL, MongoDB, REST APIs",
      additionalInfo: "Experience with microservices architecture and containerization is highly desirable.",
      userId: 1,
    },
    {
      companyName: "Data Insights Corp.",
      companyLogoUrl: "https://logo.clearbit.com/tesla.com",
      jobPosition: "Full Stack Developer",
      monthlySalary: 40000,
      jobType: "Full-Time",
      remote: "Remote",
      location: "Bangalore",
      jobDescription: "We are hiring a Full Stack Developer to work on both frontend and backend development. The candidate will be responsible for building end-to-end solutions and ensuring seamless integration between the two.",
      aboutCompany: "Data Insights Corp. is a leading provider of data-driven solutions. We help businesses harness the power of data to make informed decisions, improve operational efficiency, and drive growth.",
      skillsRequired: "React, Node.js, Express, MongoDB, REST APIs, JavaScript",
      additionalInfo: "Experience with DevOps practices and CI/CD pipelines is a plus.",
      userId: 1,
    },
    {
      companyName: "Design Studio Pro",
      companyLogoUrl: "https://logo.clearbit.com/adobe.com",
      jobPosition: "UI/UX Designer",
      monthlySalary: 45000,
      jobType: "Full-Time",
      remote: "In-Office",
      location: "Ahmedabad",
      jobDescription: "We are looking for a creative UI/UX Designer to design user interfaces for our digital products. The candidate will be responsible for creating wireframes, prototypes, and high-fidelity designs.",
      aboutCompany: "Design Studio Pro specializes in modern design solutions for businesses. We focus on creating user-centric designs that enhance user experience and drive engagement.",
      skillsRequired: "Figma, Sketch, Adobe XD, User Research, Prototyping",
      additionalInfo: "Experience with AR/VR design is a plus.",
      userId: 1,
    },
    {
      companyName: "Marketing Pro Agency",
      companyLogoUrl: "https://logo.clearbit.com/marketingpro.com",
      jobPosition: "Digital Marketing Specialist",
      monthlySalary: 40000,
      jobType: "Part-Time",
      remote: "Remote",
      location: "Chennai",
      jobDescription: "We are hiring a Digital Marketing Specialist to manage our online marketing campaigns. The candidate will be responsible for SEO, SEM, social media marketing, and content creation.",
      aboutCompany: "Marketing Pro Agency is a leading digital marketing agency. We help businesses grow their online presence through innovative marketing strategies and data-driven campaigns.",
      skillsRequired: "SEO, SEM, Social Media Marketing, Google Analytics",
      additionalInfo: "Experience with email marketing and automation tools is a plus.",
      userId: 1,
    },
  ];

  // Check if the job_listings table is empty
  db.get(`SELECT COUNT(*) AS count FROM job_listings`, (err, row) => {
    if (err) {
      console.error("Error checking job_listings table:", err);
      return;
    }

    if (row.count === 0) {
      // Insert default job listings
      const stmt = db.prepare(
        `INSERT INTO job_listings (
          companyName, companyLogoUrl, jobPosition, monthlySalary, jobType, remote, location,
          jobDescription, aboutCompany, skillsRequired, additionalInfo, userId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      defaultJobs.forEach((job) => {
        stmt.run(
          job.companyName,
          job.companyLogoUrl,
          job.jobPosition,
          job.monthlySalary,
          job.jobType,
          job.remote,
          job.location,
          job.jobDescription,
          job.aboutCompany,
          job.skillsRequired,
          job.additionalInfo,
          job.userId
        );
      });

      stmt.finalize();
      console.log("Default job listings added successfully.");
    }
  });
};

// Call the functions to seed default user and job listings
seedDefaultUser();
seedDefaultJobListings();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, "your_jwt_secret_key", { expiresIn: "1h" });
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, "your_jwt_secret_key", (err, decoded) => {
    if (err) return res.status(400).json({ error: "Invalid token." });
    req.user = decoded;
    next();
  });
};

// Middleware to check job ownership
const checkJobOwnership = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const job = await new Promise((resolve, reject) => {
      db.get(`SELECT userId FROM job_listings WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!job) return res.status(404).json({ error: "Job listing not found" });
    if (job.userId !== userId) {
      return res.status(403).json({ error: "Access denied. You are not the owner of this job listing." });
    }

    next();
  } catch (err) {
    next(err);
  }
};

// User Signup with Validation
app.post(
  "/signup",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
          [username, email, hashedPassword],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      res.status(201).json({ id: result, username, email });
    } catch (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        next(err);
      }
    }
  }
);

// User Login with Validation
app.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      const user = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      const token = generateToken(user.id);
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// Create Job Listing with Validation
app.post(
  "/jobs",
  authenticateToken,
  [
    body("companyName").notEmpty().withMessage("Company name is required"),
    body("jobPosition").notEmpty().withMessage("Job position is required"),
    body("jobType").isIn(["Internship", "Full-Time", "Part-Time", "Contractual"]).withMessage("Invalid job type"),
    body("remote").isIn(["Remote", "In-Office"]).withMessage("Invalid remote option"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const {
        companyName,
        companyLogoUrl,
        jobPosition,
        monthlySalary,
        jobType,
        remote,
        location,
        jobDescription,
        aboutCompany,
        skillsRequired,
        additionalInfo,
      } = req.body;

      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO job_listings (
            companyName, companyLogoUrl, jobPosition, monthlySalary, jobType, remote, location,
            jobDescription, aboutCompany, skillsRequired, additionalInfo, userId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            companyName,
            companyLogoUrl,
            jobPosition,
            monthlySalary,
            jobType,
            remote,
            location,
            jobDescription,
            aboutCompany,
            skillsRequired,
            additionalInfo,
            req.user.id,
          ],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      res.status(201).json({ id: result, ...req.body, userId: req.user.id });
    } catch (err) {
      next(err);
    }
  }
);

// Get All Job Listings with Pagination, Sorting, and Filtering
app.get("/jobs", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "DESC", search, location, jobType, remote } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM job_listings`;
    let conditions = [];
    let params = [];

    if (search) {
      conditions.push(`(companyName LIKE ? OR jobPosition LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (location) {
      conditions.push(`location = ?`);
      params.push(location);
    }

    if (jobType) {
      conditions.push(`jobType = ?`);
      params.push(jobType);
    }

    if (remote) {
      conditions.push(`remote = ?`);
      params.push(remote);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const jobs = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// Get Single Job Listing
app.get("/jobs/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM job_listings WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!job) return res.status(404).json({ error: "Job listing not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// Update Job Listing (only owner can update)
app.put("/jobs/:id", authenticateToken, checkJobOwnership, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      companyLogoUrl,
      jobPosition,
      monthlySalary,
      jobType,
      remote,
      location,
      jobDescription,
      aboutCompany,
      skillsRequired,
      additionalInfo,
    } = req.body;

    const result = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE job_listings SET
          companyName = ?, companyLogoUrl = ?, jobPosition = ?, monthlySalary = ?, jobType = ?,
          remote = ?, location = ?, jobDescription = ?, aboutCompany = ?, skillsRequired = ?, additionalInfo = ?
        WHERE id = ?`,
        [
          companyName,
          companyLogoUrl,
          jobPosition,
          monthlySalary,
          jobType,
          remote,
          location,
          jobDescription,
          aboutCompany,
          skillsRequired,
          additionalInfo,
          id,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    if (result === 0) return res.status(404).json({ error: "Job listing not found" });
    res.json({ message: "Job listing updated successfully" });
  } catch (err) {
    next(err);
  }
});

// Delete Job Listing (only owner can delete)
app.delete("/jobs/:id", authenticateToken, checkJobOwnership, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run(`DELETE FROM job_listings WHERE id = ?`, [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    if (result === 0) return res.status(404).json({ error: "Job listing not found" });
    res.json({ message: "Job listing deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// Bookmark a Job
app.post("/bookmarks", authenticateToken, async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: "Job ID is required" });

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO bookmarks (jobId, userId) VALUES (?, ?)`,
        [jobId, req.user.id],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.status(201).json({ id: result, jobId, userId: req.user.id });
  } catch (err) {
    next(err);
  }
});

// Get Bookmarked Jobs
app.get("/bookmarks", authenticateToken, async (req, res, next) => {
  try {
    const jobs = await new Promise((resolve, reject) => {
      db.all(
        `SELECT job_listings.* FROM job_listings
         INNER JOIN bookmarks ON job_listings.id = bookmarks.jobId
         WHERE bookmarks.userId = ?`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(jobs);
  } catch (err) {
    next(err);
  }
});



// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error for debugging
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));