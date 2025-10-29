# GIT Grading System

A modern, full-stack grading management system built with Next.js 16, TypeScript, Prisma, PostgreSQL, and ShadCN UI.

## 🎯 Features

### 👨‍💼 Admin / Program Head
- Add and manage faculty members
- Create and manage subjects
- Manage school years and semesters
- Open/close subjects for enrollment
- Assign subjects to teachers
- Review and approve/decline grade submissions
- View comprehensive analytics

### 👨‍🏫 Teacher
- Create classes with sections (regular/irregular)
- Manage student enrollments
- Define customizable grading criteria with percentage weights
- Enter student grades with automatic calculation
- Generate midterm and final grade reports
- Export grades to Excel
- Submit grades for admin approval
- Track submission status

### 👨‍🎓 Student
- Enroll in open subjects
- View enrolled subjects per semester
- View grades (midterm, final, and overall)
- Filter grades by school year
- View teacher information

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **UI Components:** ShadCN UI
- **Styling:** Tailwind CSS
- **Form Validation:** Zod
- **Date Handling:** date-fns
- **Excel Export:** xlsx

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or pnpm package manager

## 🚀 Getting Started

### 1. Clone the repository

\`\`\`bash
git clone <repository-url>
cd grade
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 3. Set up environment variables

Create a \`.env\` file in the root directory:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ggs_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

Replace the database connection string with your PostgreSQL credentials.

### 4. Set up the database

\`\`\`bash
# Push the schema to the database
npm run db:push

# Seed the database with initial data
npm run db:seed
\`\`\`

### 5. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👤 Default Login Credentials

After seeding the database, you can log in with these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@git.edu | admin123 |
| Teacher | teacher@git.edu | teacher123 |
| Student | student@git.edu | student123 |

## 📁 Project Structure

\`\`\`
grade/
├── app/
│   ├── (dashboard)/
│   │   ├── admin/          # Admin pages
│   │   ├── teacher/        # Teacher pages
│   │   ├── student/        # Student pages
│   │   └── layout.tsx      # Dashboard layout
│   ├── auth/               # Authentication pages
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── admin/              # Admin components
│   ├── teacher/            # Teacher components
│   ├── student/            # Student components
│   ├── ui/                 # ShadCN UI components
│   └── dashboard-layout.tsx
├── lib/
│   ├── actions/            # Server Actions
│   │   ├── user.actions.ts
│   │   ├── subject.actions.ts
│   │   ├── class.actions.ts
│   │   ├── enrollment.actions.ts
│   │   ├── grade.actions.ts
│   │   └── schoolyear.actions.ts
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   └── utils.ts            # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
└── middleware.ts           # Route protection
\`\`\`

## 🗄️ Database Schema

### Main Models

- **User**: Students, teachers, and admins
- **SchoolYear**: Academic years and semesters
- **Subject**: Course offerings
- **Class**: Class sections
- **Enrollment**: Student-subject relationships
- **GradingCriteria**: Customizable grading components
- **Grade**: Student grades
- **GradeComponent**: Individual criterion scores
- **GradeSubmission**: Grade approval workflow

## 🎨 Key Features Explained

### Grading System

The grading system uses a flexible, criterion-based approach:

1. Teachers define grading criteria (e.g., Quizzes 40%, Class Standing 20%, Exams 40%)
2. Each criterion has a percentage weight
3. Teachers enter scores for each student per criterion
4. System automatically calculates weighted grades
5. Supports both midterm and final grading periods
6. Automatic pass/fail determination (75% passing grade)

### Grade Submission Workflow

1. Teacher enters all student grades
2. Teacher submits grades for admin approval
3. Admin reviews submitted grades
4. Admin can approve or decline with comments
5. Teacher can view submission status and feedback

### Role-Based Access Control

- Middleware protects routes based on user roles
- Role-specific dashboards and navigation
- Server-side session validation
- API routes protected by authentication

## 📊 Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio
\`\`\`

## 🔧 Configuration

### Adding New Grading Criteria

Teachers can add custom grading criteria from the class detail page:
1. Navigate to class
2. Go to "Grading Criteria" tab
3. Click "Add Criteria"
4. Define name, percentage, and period (midterm/final)

### Managing School Years

Admins can create and manage school years:
1. Navigate to "School Years"
2. Click "Add School Year"
3. Enter year, semester, and dates
4. Set as active school year

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Setup for Production

1. Create PostgreSQL database
2. Update DATABASE_URL in environment variables
3. Run migrations: \`npx prisma db push\`
4. Seed database: \`npm run db:seed\`

## 📝 License

This project is created for educational purposes.

## 👥 Credits

Developed for **Glam Institute of Technology (GIT)**  
Sarangani, Philippines

---

For support or questions, please contact your system administrator.

