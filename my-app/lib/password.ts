import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  if (/^\$2[aby]\$/.test(hashedPassword)) {
    return bcrypt.compare(password, hashedPassword);
  }

  return password === hashedPassword;
}
