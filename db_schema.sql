-- DROP TABLES CASO EXISTAM (PARA LIMPEZA)
-- DROP TABLE IF EXISTS shop_settings, expense_categories, expenses, recurring_schedules, appointments, services, barbers, users CASCADE;

-- TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  "avatarUrl" TEXT,
  "noShowCount" INT DEFAULT 0,
  "loyaltyPoints" INT DEFAULT 0,
  "latestCuts" JSONB DEFAULT '[]',
  "stylePreferences" JSONB DEFAULT '[]',
  "cutsCount" INT DEFAULT 0,
  "barberId" TEXT,
  "pushSubscription" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE BARBEIROS
CREATE TABLE IF NOT EXISTS barbers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT,
  bio TEXT,
  color TEXT,
  specialties JSONB DEFAULT '[]',
  "yearsOfExperience" INT DEFAULT 0,
  description TEXT,
  "availableHours" JSONB DEFAULT '[]',
  "availableDates" JSONB DEFAULT '[]',
  "userId" TEXT REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration INT NOT NULL,
  "loyaltyPoints" INT DEFAULT 0,
  category TEXT DEFAULT 'Outros',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  "barberId" TEXT REFERENCES barbers(id),
  "serviceId" TEXT REFERENCES services(id),
  "serviceIds" JSONB DEFAULT '[]',
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  "servicePrice" NUMERIC(10, 2) NOT NULL,
  "extraCharges" NUMERIC(10, 2) DEFAULT 0,
  "finalPrice" NUMERIC(10, 2),
  "amountPaid" NUMERIC(10, 2) DEFAULT 0,
  "discount" NUMERIC(10, 2) DEFAULT 0,
  "paymentType" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "isDelayed" BOOLEAN DEFAULT false,
  "guestName" TEXT,
  "guestEmail" TEXT,
  "guestPhone" TEXT,
  "reminderSent" BOOLEAN DEFAULT false,
  "cancelledReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE AGENDAMENTOS RECORRENTES (BLOQUEIOS)
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id TEXT PRIMARY KEY,
  "barberId" TEXT REFERENCES barbers(id),
  "userId" TEXT REFERENCES users(id),
  "serviceId" TEXT REFERENCES services(id),
  "serviceIds" JSONB DEFAULT '[]',
  "dayOfWeek" INT NOT NULL,
  time TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'weekly',
  "startDate" DATE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE DESPESAS
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  "barberId" TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'paid',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE CATEGORIAS DE DESPESAS
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE CONFIGURAÇÕES DO SISTEMA (CHAVE-VALOR)
CREATE TABLE IF NOT EXISTS shop_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT,
  stock INT DEFAULT 0,
  image TEXT,
  image2 TEXT,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
