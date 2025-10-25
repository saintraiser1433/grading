# GIT Grading System - Quick Setup Guide

## Prerequisites

Before you begin, make sure you have:

1. **Node.js 18 or higher** installed
   - Check: `node --version`
   - Download from: https://nodejs.org/

2. **PostgreSQL** installed and running
   - Check: `psql --version`
   - Download from: https://www.postgresql.org/download/

3. **A package manager** (npm comes with Node.js, or install pnpm)
   - Check: `npm --version`

## Step-by-Step Setup

### 1. Create PostgreSQL Database

Open your PostgreSQL terminal or pgAdmin and run:

\`\`\`sql
CREATE DATABASE ggs_db;
\`\`\`

Or use the command line:

\`\`\`bash
createdb ggs_db
\`\`\`

### 2. Update Environment Variables

The \`.env\` file should already exist. Update it with your PostgreSQL credentials:

\`\`\`env
# Update the username, password, and database name
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/ggs_db?schema=public"

# Keep these as is for local development
NEXTAUTH_SECRET="ggs-secret-key-change-in-production-123456"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

**Example:**
If your PostgreSQL username is `postgres` and password is `admin123`:
\`\`\`env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/ggs_db?schema=public"
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This will install all required packages including:
- Next.js
- Prisma
- NextAuth
- ShadCN UI components
- And all other dependencies

### 4. Generate Prisma Client

\`\`\`bash
npx prisma generate
\`\`\`

### 5. Push Database Schema

\`\`\`bash
npm run db:push
\`\`\`

This command will create all the necessary tables in your database.

### 6. Seed the Database

\`\`\`bash
npm run db:seed
\`\`\`

This will create:
- Demo admin account
- Demo teacher account
- Demo student account
- Sample school year (2024-2025)
- Sample subjects (CS101, MATH101)
- Sample class with grading criteria

### 7. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at: **http://localhost:3000**

### 8. Login with Demo Accounts

Navigate to http://localhost:3000/auth/login

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@git.edu | admin123 |
| **Teacher** | teacher@git.edu | teacher123 |
| **Student** | student@git.edu | student123 |

## Troubleshooting

### Issue: "Can't reach database server"

**Solution:** Make sure PostgreSQL is running:
\`\`\`bash
# On Windows (if using Windows service)
services.msc  # Look for PostgreSQL service

# On Mac
brew services start postgresql

# On Linux
sudo systemctl start postgresql
\`\`\`

### Issue: "Database does not exist"

**Solution:** Create the database:
\`\`\`bash
createdb ggs_db
\`\`\`

### Issue: "Authentication failed"

**Solution:** Check your DATABASE_URL credentials in the .env file

### Issue: Port 3000 already in use

**Solution:** Either:
1. Stop the process using port 3000
2. Or run on a different port:
\`\`\`bash
PORT=3001 npm run dev
\`\`\`

### Issue: Missing dependencies

**Solution:** Clear cache and reinstall:
\`\`\`bash
rm -rf node_modules
rm package-lock.json
npm install
\`\`\`

## Viewing the Database

To view and manage your database visually:

\`\`\`bash
npm run db:studio
\`\`\`

This opens Prisma Studio at http://localhost:5555

## Testing the System

### As Admin:
1. Login with admin@git.edu
2. Navigate to "Faculty" and create a new teacher
3. Navigate to "Subjects" and create/open subjects
4. Navigate to "School Years" and manage academic years
5. Navigate to "Grade Submissions" to approve/decline teacher submissions

### As Teacher:
1. Login with teacher@git.edu
2. Navigate to "My Classes" and create a new class
3. Click on a class to manage students
4. Set up grading criteria in the "Grading Criteria" tab
5. Enter grades in "Midterm Grades" or "Final Grades" tabs
6. Submit grades for admin approval

### As Student:
1. Login with student@git.edu
2. Navigate to "Enroll Subjects" to enroll in open subjects
3. Navigate to "My Grades" to view your grades

## Next Steps

1. **Change default passwords** in production
2. **Update NEXTAUTH_SECRET** to a secure random string
3. **Configure email service** for password resets (if needed)
4. **Set up backup system** for the database
5. **Configure domain and SSL** for production deployment

## Production Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 2: VPS (Ubuntu)

1. Install Node.js and PostgreSQL on your server
2. Clone the repository
3. Set up environment variables
4. Run database migrations
5. Build the application: `npm run build`
6. Start with PM2: `pm2 start npm --name "ggs" -- start`
7. Set up Nginx as reverse proxy

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main README.md
3. Check Prisma logs: `npx prisma studio`
4. Check application logs in the terminal

---

**Congratulations!** 🎉 Your GIT Grading System is now ready to use!

