# 🚀 Quick Start - GIT Grading System

## ⚠️ IMPORTANT: First Step

**Create a `.env` file** in the root directory with the following content:

\`\`\`env
# Database - UPDATE THESE WITH YOUR POSTGRESQL CREDENTIALS
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ggs_db?schema=public"

# NextAuth - Keep these for local development
NEXTAUTH_SECRET="ggs-secret-key-change-in-production-123456"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

**Example:** If your PostgreSQL password is `admin123`:
\`\`\`env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/ggs_db?schema=public"
NEXTAUTH_SECRET="ggs-secret-key-change-in-production-123456"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## ⚡ Quick Setup Commands

After creating the `.env` file, run these commands in order:

\`\`\`bash
# 1. Create the database (in PostgreSQL)
createdb ggs_db

# 2. Push schema to database
npm run db:push

# 3. Seed with demo data
npm run db:seed

# 4. Start the development server
npm run dev
\`\`\`

## 🔑 Demo Login Credentials

Visit: **http://localhost:3000/auth/login**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@git.edu | admin123 |
| **Teacher** | teacher@git.edu | teacher123 |
| **Student** | student@git.edu | student123 |

## 📸 What You'll See

### Admin Dashboard
- Manage faculty, subjects, and school years
- Approve/decline grade submissions
- View system statistics

### Teacher Dashboard
- Create and manage classes
- Define grading criteria (customizable percentages)
- Enter student grades with automatic calculation
- Submit grades for approval
- Export grades to Excel

### Student Dashboard
- Enroll in open subjects
- View grades by semester
- Track academic progress

## 🎯 Try These Features

### As Admin (admin@git.edu)
1. ✅ Go to **Faculty** → Add a new teacher
2. ✅ Go to **Subjects** → Create a subject and toggle it "Open"
3. ✅ Go to **School Years** → View the active semester
4. ✅ Go to **Grade Submissions** → Review submitted grades

### As Teacher (teacher@git.edu)
1. ✅ Go to **My Classes** → Click on "CS101 - BSIT 3A"
2. ✅ Click **Grading Criteria** tab → View the preset criteria
3. ✅ Click **Midterm Grades** tab → Enter student scores
4. ✅ Click **Save All** → Then **Submit for Approval**
5. ✅ Go to **Grade Submissions** → Check status

### As Student (student@git.edu)
1. ✅ Go to **Enroll Subjects** → Enroll in MATH101
2. ✅ Go to **My Grades** → View your grades for CS101

## 🔧 Useful Commands

\`\`\`bash
# View database in browser
npm run db:studio

# Check for errors
npm run lint

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## 📝 Grading System Explained

The system uses **weighted grading criteria**:

Example for Midterm:
- Quizzes: 40%
- Class Standing: 20%
- Major Exam: 40%

**How it works:**
1. Teacher enters: Score / Max Score (e.g., 45/50 for quizzes)
2. System calculates: (45/50) × 100 = 90%
3. Weighted: 90% × 40% = 36 points
4. Total = Sum of all weighted scores
5. Pass if total ≥ 75%

## 🎨 Customization

### Change Grading Criteria
Teachers can modify the criteria:
- Navigate to any class
- Go to "Grading Criteria" tab
- Add/Edit/Delete criteria
- Set custom percentages (must total 100%)

### Add More Subjects
Admins can add subjects:
- Navigate to "Subjects"
- Click "Add Subject"
- Toggle "Open for Enrollment"

## 💡 Tips

1. **Grading criteria percentages must total 100%** for each period (midterm/final)
2. **Save grades frequently** while entering to avoid data loss
3. **Submit grades only when complete** - submissions require admin approval
4. **Export grades** before submission for backup
5. **Use Prisma Studio** (npm run db:studio) to view/edit database directly

## 🐛 Common Issues

### Can't connect to database?
- Make sure PostgreSQL is running
- Check your DATABASE_URL in .env file
- Verify database exists: `psql -l` (should show ggs_db)

### "Authentication failed"?
- Check PostgreSQL username/password in .env
- Try connecting manually: `psql -U postgres -d ggs_db`

### Seed script fails?
- Make sure db:push completed successfully first
- Check if data already exists (seed uses upsert, so it's safe to run multiple times)

## 📚 Learn More

- Full documentation: See **README.md**
- Detailed setup: See **SETUP.md**
- Database schema: Check **prisma/schema.prisma**
- Server actions: Browse **lib/actions/**

## 🎉 You're All Set!

The system is now ready to use. Start by logging in as Admin to set up your school data, then as Teacher to manage classes and grades!

---

**Need help?** Review the documentation or check the troubleshooting sections in SETUP.md

