Gym Management System
A web application for managing gym members, memberships, payments, and check-ins using QR codes.

Technologies: NestJS, Next.js, PostgreSQL, Prisma, Auth.js, Tailwind CSS.
Main Features
- Register and manage gym members.
- Create and manage membership packages.
- Scan QR codes for check-ins.
- Sell day passes.
- Track membership expiry.
- Manage admin and receptionist roles.
- View dashboard statistics.
- Keep records of check-ins.
Project Structure
Gym-Management/
├── gym-backend/    # NestJS API and database
└── gym-frontend/   # Next.js user interface


Installation
1. Clone the project
git clone https://github.com/yabetsbeyene/Gym-Management.git
cd Gym-Management


2. Start the backend
cd gym-backend
npm install


Configure your database settings in the .env file, then run:
npx prisma migrate dev
npm run start:dev


3. Start the frontend

Open another terminal:
cd gym-frontend
npm install
npm run dev


Open http://localhost:3000 in your browser.
User Roles
- Admin: Manages members, packages, dashboard, and system records.
- Receptionist: Registers members, manages memberships, and handles check-ins.
Future Improvements
- Online payments and receipts.
- SMS notifications.
- Staff management.
- Automatic membership expiry reminders.
- Online deployment.
