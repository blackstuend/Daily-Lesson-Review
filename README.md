# Daily Lesson Review

A spaced repetition learning application that helps you master and retain what you learn using scientifically proven review intervals.

## Features

- **Spaced Repetition System**: Review lessons at optimal intervals (0, 1, 3, and 7 days) to maximize retention
- **Multiple Lesson Types**: Save links, difficult words, or sentences you want to remember
- **Daily Reviews**: Get reminded to review at the right time
- **Progress Tracking**: Visualize your learning journey with calendar view
- **User Authentication**: Secure authentication powered by Supabase
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd daily-lesson-review
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

Run the SQL scripts in the `scripts/` directory in your Supabase SQL editor:
- `001_create_lessons_table.sql` - Creates the lessons and review_schedule tables
- `002_create_review_trigger.sql` - Sets up automatic review scheduling

5. Run the development server:
```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages (login, sign-up)
│   ├── dashboard/         # Dashboard and main app features
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── scripts/              # Database setup scripts
├── stores/               # Zustand state management
├── styles/               # Additional styles
└── public/               # Static assets
```

## Database Schema

### Lessons Table
Stores user's learning content with support for three types:
- **link**: Web links to articles, videos, or resources
- **word**: Difficult words to remember
- **sentence**: Important sentences or phrases

### Review Schedule Table
Tracks the spaced repetition schedule for each lesson:
- Review intervals: 0, 1, 3, and 7 days
- Completion tracking
- Automatic scheduling via database triggers

## How It Works

1. **Add Lessons**: Create new lessons by adding links, words, or sentences you want to remember
2. **Automatic Scheduling**: The system automatically creates a review schedule with intervals at 0, 1, 3, and 7 days
3. **Daily Reviews**: Check your dashboard to see which lessons are due for review today
4. **Mark as Complete**: Mark reviews as complete after studying them
5. **Track Progress**: View your learning progress on the calendar

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## License

This project is private and not licensed for public use.

## Contributing

This is a private project. Contributions are not currently accepted.
